#!/usr/bin/env python3
"""
SuiShouJi (随手记) Excel Migration Script

Reads exported SuiShouJi Excel file → cleans data → maps categories/accounts →
inserts into MySQL internal_platform.transactions → outputs summary report.

Usage:
    python migrate-suishouji.py --file path/to/export.xlsx [--db-host 127.0.0.1] [--dry-run]

Requirements:
    pip install openpyxl mysql-connector-python
"""

import argparse
import sys
from datetime import datetime
from pathlib import Path

try:
    import openpyxl
except ImportError:
    sys.exit("Error: pip install openpyxl")

try:
    import mysql.connector
except ImportError:
    sys.exit("Error: pip install mysql-connector-python")


# ── Default column mapping (SuiShouJi export format) ──
# Adjust indices if your export differs
COL_DATE = 0        # 日期
COL_TYPE = 1        # 类型 (支出/收入/转账)
COL_AMOUNT = 2      # 金额
COL_CATEGORY = 3    # 分类
COL_SUBCATEGORY = 4 # 子分类
COL_ACCOUNT = 5     # 账户
COL_TO_ACCOUNT = 6  # 转入账户 (transfers only)
COL_NOTE = 7        # 备注
COL_COUNTERPARTY = 8  # 商家 (may not exist in all exports)

TYPE_MAP = {
    '支出': 'expense',
    '收入': 'income',
    '转账': 'transfer',
    '退款': 'refund',
}


def parse_args():
    p = argparse.ArgumentParser(description='Migrate SuiShouJi data to internal platform')
    p.add_argument('--file', required=True, help='Path to SuiShouJi export Excel file')
    p.add_argument('--db-host', default='127.0.0.1')
    p.add_argument('--db-port', type=int, default=3306)
    p.add_argument('--db-name', default='internal_platform')
    p.add_argument('--db-user', default='metabase')
    p.add_argument('--db-password', default='Linxi#sql123')
    p.add_argument('--created-by', type=int, default=1, help='User ID for created_by')
    p.add_argument('--dry-run', action='store_true', help='Parse only, do not insert')
    p.add_argument('--sheet', default=None, help='Sheet name (default: first sheet)')
    p.add_argument('--skip-rows', type=int, default=1, help='Header rows to skip')
    return p.parse_args()


def load_excel(filepath, sheet_name=None, skip_rows=1):
    """Load and parse the SuiShouJi Excel export."""
    wb = openpyxl.load_workbook(filepath, read_only=True)
    ws = wb[sheet_name] if sheet_name else wb.active
    rows = []
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i < skip_rows:
            continue
        if not row or not row[COL_DATE]:
            continue
        rows.append(row)
    wb.close()
    return rows


def clean_amount(val):
    """Parse amount, handling string/number formats."""
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        return abs(float(val))
    s = str(val).replace(',', '').replace('¥', '').replace('$', '').strip()
    try:
        return abs(float(s))
    except ValueError:
        return 0.0


def parse_date(val):
    """Parse date from various formats."""
    if isinstance(val, datetime):
        return val.strftime('%Y-%m-%d')
    s = str(val).strip()
    for fmt in ('%Y-%m-%d', '%Y/%m/%d', '%Y年%m月%d日', '%m/%d/%Y'):
        try:
            return datetime.strptime(s, fmt).strftime('%Y-%m-%d')
        except ValueError:
            continue
    return s[:10]  # fallback


def get_or_create_category(cursor, name, tx_type, cache):
    """Get existing category ID or create new one."""
    key = (name, tx_type)
    if key in cache:
        return cache[key]

    cursor.execute('SELECT id FROM categories WHERE name = %s AND type = %s', (name, tx_type))
    row = cursor.fetchone()
    if row:
        cache[key] = row[0]
        return row[0]

    cursor.execute(
        'INSERT INTO categories (name, type) VALUES (%s, %s)',
        (name, tx_type)
    )
    cat_id = cursor.lastrowid
    cache[key] = cat_id
    return cat_id


def get_or_create_account(cursor, name, cache):
    """Get existing account ID or create new one."""
    if not name:
        return None
    if name in cache:
        return cache[name]

    cursor.execute('SELECT id FROM accounts WHERE name = %s', (name,))
    row = cursor.fetchone()
    if row:
        cache[name] = row[0]
        return row[0]

    cursor.execute(
        'INSERT INTO accounts (name, type, currency) VALUES (%s, %s, %s)',
        (name, 'other', 'CNY')
    )
    acc_id = cursor.lastrowid
    cache[name] = acc_id
    return acc_id


def main():
    args = parse_args()
    filepath = Path(args.file)
    if not filepath.exists():
        sys.exit(f'File not found: {filepath}')

    print(f'Loading {filepath} ...')
    rows = load_excel(str(filepath), args.sheet, args.skip_rows)
    print(f'Parsed {len(rows)} rows')

    if not rows:
        print('No data to migrate.')
        return

    # Stats
    stats = {'inserted': 0, 'skipped': 0, 'errors': 0, 'categories_created': 0, 'accounts_created': 0}

    if args.dry_run:
        print('\n[DRY RUN] Showing first 5 parsed rows:')
        for r in rows[:5]:
            date = parse_date(r[COL_DATE])
            tx_type = TYPE_MAP.get(str(r[COL_TYPE] or '').strip(), 'expense')
            amount = clean_amount(r[COL_AMOUNT])
            category = str(r[COL_CATEGORY] or '').strip()
            account = str(r[COL_ACCOUNT] or '').strip()
            note = str(r[COL_NOTE] or '').strip() if len(r) > COL_NOTE else ''
            print(f'  {date} | {tx_type:8s} | {amount:>10.2f} | {category:12s} | {account:12s} | {note}')
        print(f'\nTotal rows: {len(rows)}. Run without --dry-run to insert.')
        return

    # Connect to database
    print(f'Connecting to MySQL {args.db_host}:{args.db_port}/{args.db_name} ...')
    conn = mysql.connector.connect(
        host=args.db_host, port=args.db_port,
        database=args.db_name, user=args.db_user, password=args.db_password,
        charset='utf8mb4'
    )
    cursor = conn.cursor()

    cat_cache = {}
    acc_cache = {}

    insert_sql = """
        INSERT INTO transactions
            (type, amount, currency, date, account_id, to_account_id, category_id, description, counterparty, created_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    for i, row in enumerate(rows):
        try:
            date = parse_date(row[COL_DATE])
            raw_type = str(row[COL_TYPE] or '').strip()
            tx_type = TYPE_MAP.get(raw_type, 'expense')
            amount = clean_amount(row[COL_AMOUNT])

            if amount <= 0:
                stats['skipped'] += 1
                continue

            category_name = str(row[COL_CATEGORY] or '').strip()
            if row[COL_SUBCATEGORY]:
                category_name = str(row[COL_SUBCATEGORY]).strip() or category_name

            account_name = str(row[COL_ACCOUNT] or '').strip()
            to_account_name = str(row[COL_TO_ACCOUNT] or '').strip() if len(row) > COL_TO_ACCOUNT else ''
            note = str(row[COL_NOTE] or '').strip() if len(row) > COL_NOTE else ''
            counterparty = str(row[COL_COUNTERPARTY] or '').strip() if len(row) > COL_COUNTERPARTY else ''

            cat_type = 'income' if tx_type == 'income' else 'expense'
            category_id = get_or_create_category(cursor, category_name, cat_type, cat_cache) if category_name else None
            account_id = get_or_create_account(cursor, account_name, acc_cache)
            to_account_id = get_or_create_account(cursor, to_account_name, acc_cache) if to_account_name else None

            cursor.execute(insert_sql, (
                tx_type, amount, 'CNY', date,
                account_id, to_account_id, category_id,
                note or None, counterparty or None, args.created_by,
            ))
            stats['inserted'] += 1

        except Exception as e:
            stats['errors'] += 1
            print(f'  Row {i + 1 + args.skip_rows}: ERROR - {e}')

    conn.commit()
    cursor.close()
    conn.close()

    # Report
    print('\n' + '=' * 50)
    print('Migration Report')
    print('=' * 50)
    print(f"  Rows parsed:      {len(rows)}")
    print(f"  Inserted:         {stats['inserted']}")
    print(f"  Skipped (0 amt):  {stats['skipped']}")
    print(f"  Errors:           {stats['errors']}")
    print(f"  Categories used:  {len(cat_cache)}")
    print(f"  Accounts used:    {len(acc_cache)}")
    print('=' * 50)


if __name__ == '__main__':
    main()
