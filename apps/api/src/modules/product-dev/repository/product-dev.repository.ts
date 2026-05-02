import { query } from '../../../database/index.js';
import type {
  ProductDevProject,
  SupplierQuote,
  ProfitCalculation,
  SampleRecord,
  SyncRecord,
} from '../../../common/entity-types.js';

export async function listProjects(): Promise<ProductDevProject[]> {
  return await query<ProductDevProject>(
    `SELECT
      id,
      project_code AS projectCode,
      product_name AS productName,
      sku,
      developer_name AS developerName,
      owner_name AS ownerName,
      target_platform AS targetPlatform,
      target_market AS targetMarket,
      estimated_cost AS estimatedCost,
      target_price AS targetPrice,
      gross_margin_target AS grossMarginTarget,
      project_status AS projectStatus
    FROM product_dev_projects
    ORDER BY id DESC`,
  );
}

export async function getProjectById(id: number): Promise<ProductDevProject | null> {
  const rows = await query<ProductDevProject>(
    `SELECT
      id,
      project_code AS projectCode,
      product_name AS productName,
      sku,
      developer_name AS developerName,
      owner_name AS ownerName,
      target_platform AS targetPlatform,
      target_market AS targetMarket,
      estimated_cost AS estimatedCost,
      target_price AS targetPrice,
      gross_margin_target AS grossMarginTarget,
      project_status AS projectStatus
    FROM product_dev_projects
    WHERE id = ?`,
    [id],
  );

  return rows[0] || null;
}

export async function createProjectRecord(payload: Partial<ProductDevProject>): Promise<ProductDevProject | null> {
  const result = await query(
    `INSERT INTO product_dev_projects (
      project_code,
      product_name,
      sku,
      developer_name,
      owner_name,
      target_platform,
      target_market,
      estimated_cost,
      target_price,
      gross_margin_target,
      project_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.projectCode,
      payload.productName,
      payload.sku,
      payload.developerName,
      payload.ownerName,
      payload.targetPlatform,
      payload.targetMarket,
      payload.estimatedCost,
      payload.targetPrice,
      payload.grossMarginTarget,
      payload.projectStatus,
    ],
  );

  return await getProjectById(Number((result as any).insertId));
}

export async function updateProjectRecord(id: number, payload: Partial<ProductDevProject>): Promise<ProductDevProject | null> {
  await query(
    `UPDATE product_dev_projects
    SET project_code = ?, product_name = ?, sku = ?, developer_name = ?, owner_name = ?, target_platform = ?, target_market = ?, estimated_cost = ?, target_price = ?, gross_margin_target = ?, project_status = ?
    WHERE id = ?`,
    [
      payload.projectCode,
      payload.productName,
      payload.sku,
      payload.developerName,
      payload.ownerName,
      payload.targetPlatform,
      payload.targetMarket,
      payload.estimatedCost,
      payload.targetPrice,
      payload.grossMarginTarget,
      payload.projectStatus,
      id,
    ],
  );

  return await getProjectById(id);
}

export async function deleteProjectRecord(id: number): Promise<void> {
  await query('DELETE FROM product_dev_projects WHERE id = ?', [id]);
}

export async function listQuotes(): Promise<SupplierQuote[]> {
  return await query<SupplierQuote>(
    `SELECT
      id,
      project_id AS projectId,
      supplier_name AS supplierName,
      supplier_erp_id AS supplierErpId,
      currency,
      quote_price AS quotePrice,
      moq,
      tax_included AS taxIncluded,
      delivery_days AS deliveryDays,
      preferred_flag AS preferred
    FROM supplier_quotes
    ORDER BY id DESC`,
  );
}

export async function getQuoteById(id: number): Promise<SupplierQuote | null> {
  const rows = await query<SupplierQuote>(
    `SELECT
      id,
      project_id AS projectId,
      supplier_name AS supplierName,
      supplier_erp_id AS supplierErpId,
      currency,
      quote_price AS quotePrice,
      moq,
      tax_included AS taxIncluded,
      delivery_days AS deliveryDays,
      preferred_flag AS preferred
    FROM supplier_quotes
    WHERE id = ?`,
    [id],
  );

  return rows[0] || null;
}

export async function listQuotesByProjectId(projectId: number): Promise<SupplierQuote[]> {
  return await query<SupplierQuote>(
    `SELECT
      id,
      project_id AS projectId,
      supplier_name AS supplierName,
      supplier_erp_id AS supplierErpId,
      currency,
      quote_price AS quotePrice,
      moq,
      tax_included AS taxIncluded,
      delivery_days AS deliveryDays,
      preferred_flag AS preferred
    FROM supplier_quotes
    WHERE project_id = ?
    ORDER BY id ASC`,
    [projectId],
  );
}

export async function createQuoteRecord(payload: Partial<SupplierQuote>): Promise<SupplierQuote | null> {
  const result = await query(
    `INSERT INTO supplier_quotes (
      project_id,
      supplier_name,
      supplier_erp_id,
      currency,
      quote_price,
      moq,
      tax_included,
      delivery_days,
      preferred_flag
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.projectId,
      payload.supplierName,
      payload.supplierErpId,
      payload.currency,
      payload.quotePrice,
      payload.moq,
      payload.taxIncluded,
      payload.deliveryDays,
      payload.preferred,
    ],
  );

  return await getQuoteById(Number((result as any).insertId));
}

export async function updateQuoteRecord(id: number, payload: Partial<SupplierQuote>): Promise<SupplierQuote | null> {
  await query(
    `UPDATE supplier_quotes
    SET project_id = ?, supplier_name = ?, supplier_erp_id = ?, currency = ?, quote_price = ?, moq = ?, tax_included = ?, delivery_days = ?, preferred_flag = ?
    WHERE id = ?`,
    [
      payload.projectId,
      payload.supplierName,
      payload.supplierErpId,
      payload.currency,
      payload.quotePrice,
      payload.moq,
      payload.taxIncluded,
      payload.deliveryDays,
      payload.preferred,
      id,
    ],
  );

  return await getQuoteById(id);
}

export async function deleteQuoteRecord(id: number): Promise<void> {
  await query('DELETE FROM supplier_quotes WHERE id = ?', [id]);
}

export async function listProfitCalculations(): Promise<ProfitCalculation[]> {
  return await query<ProfitCalculation>(
    `SELECT
      id,
      project_id AS projectId,
      sales_price_usd AS salesPriceUsd,
      exchange_rate AS exchangeRate,
      product_cost_rmb AS productCostRmb,
      accessory_cost_rmb AS accessoryCostRmb,
      shipping_express AS shippingExpress,
      shipping_air AS shippingAir,
      shipping_sea AS shippingSea,
      selected_plan AS selectedPlan,
      selected_profit AS selectedProfit,
      selected_profit_rate AS selectedProfitRate,
      calculated_by AS calculatedBy
    FROM profit_calculations
    ORDER BY id DESC`,
  );
}

export async function getProfitCalculationById(id: number): Promise<ProfitCalculation | null> {
  const rows = await query<ProfitCalculation>(
    `SELECT
      id,
      project_id AS projectId,
      sales_price_usd AS salesPriceUsd,
      exchange_rate AS exchangeRate,
      product_cost_rmb AS productCostRmb,
      accessory_cost_rmb AS accessoryCostRmb,
      shipping_express AS shippingExpress,
      shipping_air AS shippingAir,
      shipping_sea AS shippingSea,
      selected_plan AS selectedPlan,
      selected_profit AS selectedProfit,
      selected_profit_rate AS selectedProfitRate,
      calculated_by AS calculatedBy
    FROM profit_calculations
    WHERE id = ?`,
    [id],
  );

  return rows[0] || null;
}

export async function listProfitCalculationsByProjectId(projectId: number): Promise<ProfitCalculation[]> {
  return await query<ProfitCalculation>(
    `SELECT
      id,
      project_id AS projectId,
      sales_price_usd AS salesPriceUsd,
      exchange_rate AS exchangeRate,
      product_cost_rmb AS productCostRmb,
      accessory_cost_rmb AS accessoryCostRmb,
      shipping_express AS shippingExpress,
      shipping_air AS shippingAir,
      shipping_sea AS shippingSea,
      selected_plan AS selectedPlan,
      selected_profit AS selectedProfit,
      selected_profit_rate AS selectedProfitRate,
      calculated_by AS calculatedBy
    FROM profit_calculations
    WHERE project_id = ?
    ORDER BY id DESC`,
    [projectId],
  );
}

export async function createProfitCalculationRecord(payload: Partial<ProfitCalculation>): Promise<ProfitCalculation | null> {
  const result = await query(
    `INSERT INTO profit_calculations (
      project_id,
      sales_price_usd,
      exchange_rate,
      product_cost_rmb,
      accessory_cost_rmb,
      shipping_express,
      shipping_air,
      shipping_sea,
      selected_plan,
      selected_profit,
      selected_profit_rate,
      calculated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.projectId,
      payload.salesPriceUsd,
      payload.exchangeRate,
      payload.productCostRmb,
      payload.accessoryCostRmb,
      payload.shippingExpress,
      payload.shippingAir,
      payload.shippingSea,
      payload.selectedPlan,
      payload.selectedProfit,
      payload.selectedProfitRate,
      payload.calculatedBy,
    ],
  );

  return await getProfitCalculationById(Number((result as any).insertId));
}

export async function updateProfitCalculationRecord(id: number, payload: Partial<ProfitCalculation>): Promise<ProfitCalculation | null> {
  await query(
    `UPDATE profit_calculations
    SET project_id = ?, sales_price_usd = ?, exchange_rate = ?, product_cost_rmb = ?, accessory_cost_rmb = ?, shipping_express = ?, shipping_air = ?, shipping_sea = ?, selected_plan = ?, selected_profit = ?, selected_profit_rate = ?, calculated_by = ?
    WHERE id = ?`,
    [
      payload.projectId,
      payload.salesPriceUsd,
      payload.exchangeRate,
      payload.productCostRmb,
      payload.accessoryCostRmb,
      payload.shippingExpress,
      payload.shippingAir,
      payload.shippingSea,
      payload.selectedPlan,
      payload.selectedProfit,
      payload.selectedProfitRate,
      payload.calculatedBy,
      id,
    ],
  );

  return await getProfitCalculationById(id);
}

export async function deleteProfitCalculationRecord(id: number): Promise<void> {
  await query('DELETE FROM profit_calculations WHERE id = ?', [id]);
}

export async function listSampleRecords(): Promise<SampleRecord[]> {
  return await query<SampleRecord>(
    `SELECT
      id,
      project_id AS projectId,
      round_no AS roundNo,
      supplier_name AS supplierName,
      sample_fee AS sampleFee,
      review_result AS reviewResult,
      improvement_notes AS improvementNotes
    FROM sample_records
    ORDER BY id DESC`,
  );
}

export async function listSampleRecordsByProjectId(projectId: number): Promise<SampleRecord[]> {
  return await query<SampleRecord>(
    `SELECT
      id,
      project_id AS projectId,
      round_no AS roundNo,
      supplier_name AS supplierName,
      sample_fee AS sampleFee,
      review_result AS reviewResult,
      improvement_notes AS improvementNotes
    FROM sample_records
    WHERE project_id = ?
    ORDER BY id ASC`,
    [projectId],
  );
}

export async function getSampleRecordById(id: number): Promise<SampleRecord | null> {
  const rows = await query<SampleRecord>(
    `SELECT
      id,
      project_id AS projectId,
      round_no AS roundNo,
      supplier_name AS supplierName,
      sample_fee AS sampleFee,
      review_result AS reviewResult,
      improvement_notes AS improvementNotes
    FROM sample_records
    WHERE id = ?`,
    [id],
  );

  return rows[0] || null;
}

export async function createSampleRecord(payload: Partial<SampleRecord>): Promise<SampleRecord | null> {
  const result = await query(
    `INSERT INTO sample_records (
      project_id,
      round_no,
      supplier_name,
      sample_fee,
      review_result,
      improvement_notes
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      payload.projectId,
      payload.roundNo,
      payload.supplierName,
      payload.sampleFee,
      payload.reviewResult,
      payload.improvementNotes,
    ],
  );

  return await getSampleRecordById(Number((result as any).insertId));
}

export async function updateSampleRecord(id: number, payload: Partial<SampleRecord>): Promise<SampleRecord | null> {
  await query(
    `UPDATE sample_records
    SET project_id = ?, round_no = ?, supplier_name = ?, sample_fee = ?, review_result = ?, improvement_notes = ?
    WHERE id = ?`,
    [
      payload.projectId,
      payload.roundNo,
      payload.supplierName,
      payload.sampleFee,
      payload.reviewResult,
      payload.improvementNotes,
      id,
    ],
  );

  return await getSampleRecordById(id);
}

export async function deleteSampleRecord(id: number): Promise<void> {
  await query('DELETE FROM sample_records WHERE id = ?', [id]);
}

export async function listSyncRecordsByProjectId(projectId: number): Promise<SyncRecord[]> {
  return await query<SyncRecord>(
    `SELECT
      id,
      project_id AS projectId,
      sync_status AS syncStatus,
      synced_by AS syncedBy,
      sync_time AS syncTime,
      result_message AS resultMessage
    FROM lingxing_sync_records
    WHERE project_id = ?
    ORDER BY id DESC`,
    [projectId],
  );
}

export async function listSyncRecords(): Promise<SyncRecord[]> {
  return await query<SyncRecord>(
    `SELECT
      id,
      project_id AS projectId,
      sync_status AS syncStatus,
      synced_by AS syncedBy,
      sync_time AS syncTime,
      result_message AS resultMessage
    FROM lingxing_sync_records
    ORDER BY id DESC`,
  );
}

export async function getSyncRecordById(id: number): Promise<SyncRecord | null> {
  const rows = await query<SyncRecord>(
    `SELECT
      id,
      project_id AS projectId,
      sync_status AS syncStatus,
      synced_by AS syncedBy,
      sync_time AS syncTime,
      result_message AS resultMessage
    FROM lingxing_sync_records
    WHERE id = ?`,
    [id],
  );

  return rows[0] || null;
}

export async function createSyncRecord(payload: Partial<SyncRecord>): Promise<SyncRecord | null> {
  const result = await query(
    `INSERT INTO lingxing_sync_records (
      project_id,
      sync_status,
      synced_by,
      sync_time,
      result_message
    ) VALUES (?, ?, ?, ?, ?)`,
    [payload.projectId, payload.syncStatus, payload.syncedBy, payload.syncTime, payload.resultMessage],
  );

  return await getSyncRecordById(Number((result as any).insertId));
}

export async function updateSyncRecord(id: number, payload: Partial<SyncRecord>): Promise<SyncRecord | null> {
  await query(
    `UPDATE lingxing_sync_records
    SET project_id = ?, sync_status = ?, synced_by = ?, sync_time = ?, result_message = ?
    WHERE id = ?`,
    [payload.projectId, payload.syncStatus, payload.syncedBy, payload.syncTime, payload.resultMessage, id],
  );

  return await getSyncRecordById(id);
}

export async function deleteSyncRecord(id: number): Promise<void> {
  await query('DELETE FROM lingxing_sync_records WHERE id = ?', [id]);
}
