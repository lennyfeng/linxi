import React from 'react';
import { Drawer, Descriptions, Divider, Empty, List, Tag, Typography } from 'antd';
import type { AnalysisReview, AnalysisSnapshot, ItemReport } from './types';

interface Props {
  open: boolean;
  loading?: boolean;
  report: ItemReport | null;
  onClose: () => void;
}

const AsinReportDrawer: React.FC<Props> = ({ open, loading, report, onClose }) => {
  const item = report?.item;
  const snapshots = report?.snapshots || [];
  const reviews = report?.reviews || [];
  const designEvaluation = report?.designEvaluation;
  const sampleEvaluation = report?.sampleEvaluation;

  return (
    <Drawer open={open} onClose={onClose} width={920} title="ASIN 分析报告" destroyOnHidden>
      {loading ? (
        <Typography.Text>加载中...</Typography.Text>
      ) : !item ? (
        <Empty description="暂无报告数据" />
      ) : (
        <>
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="ASIN">{item.asin}</Descriptions.Item>
            <Descriptions.Item label="标题">{item.productTitle || '-'}</Descriptions.Item>
            <Descriptions.Item label="品牌">{item.brand || '-'}</Descriptions.Item>
            <Descriptions.Item label="站点">{item.marketplace || '-'}</Descriptions.Item>
            <Descriptions.Item label="价格">{item.price != null ? `$${item.price}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="评分">{item.rating != null ? Number(item.rating).toFixed(1) : '-'}</Descriptions.Item>
            <Descriptions.Item label="Review 数">{item.reviewCount ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="月销量">{item.monthlySales ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="月销售额">{item.monthlyRevenue != null ? `$${item.monthlyRevenue}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="BSR">{item.bsr ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="机会分">{item.opportunityScore != null ? Number(item.opportunityScore).toFixed(1) : '-'}</Descriptions.Item>
            <Descriptions.Item label="推荐">{item.recommendation || '-'}</Descriptions.Item>
            <Descriptions.Item label="市场分">{item.marketScore != null ? Number(item.marketScore).toFixed(1) : '-'}</Descriptions.Item>
            <Descriptions.Item label="竞争分">{item.competitionScore != null ? Number(item.competitionScore).toFixed(1) : '-'}</Descriptions.Item>
            <Descriptions.Item label="设计分">{item.designScore != null ? Number(item.designScore).toFixed(1) : '-'}</Descriptions.Item>
            <Descriptions.Item label="风险分">{item.riskScore != null ? Number(item.riskScore).toFixed(1) : '-'}</Descriptions.Item>
          </Descriptions>

          <Divider />

          <Typography.Title level={5}>系统快照</Typography.Title>
          <List
            size="small"
            bordered
            dataSource={snapshots}
            locale={{ emptyText: '暂无快照' }}
            renderItem={(snapshot: AnalysisSnapshot) => (
              <List.Item>
                <div>
                  <Tag>{snapshot.source}</Tag>
                  <span style={{ marginLeft: 8 }}>{snapshot.createdAt?.split?.('T')?.[0] || snapshot.createdAt || '-'}</span>
                  <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8, maxHeight: 180, overflow: 'auto' }}>{JSON.stringify(snapshot.payloadJson, null, 2)}</pre>
                </div>
              </List.Item>
            )}
          />

          <Divider />

          <Typography.Title level={5}>评审历史</Typography.Title>
          <List
            size="small"
            bordered
            dataSource={reviews}
            locale={{ emptyText: '暂无评审记录' }}
            renderItem={(review: AnalysisReview) => (
              <List.Item>
                <div>
                  <Tag color="blue">{review.roundName}</Tag>
                  <Tag>{review.action}</Tag>
                  <span style={{ marginLeft: 8 }}>{review.reason || review.comment || '-'}</span>
                </div>
              </List.Item>
            )}
          />

          <Divider />

          <Typography.Title level={5}>设计评估</Typography.Title>
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="状态">{designEvaluation?.status || '-'}</Descriptions.Item>
            <Descriptions.Item label="目标用户">{designEvaluation?.targetUser || '-'}</Descriptions.Item>
            <Descriptions.Item label="使用场景">{designEvaluation?.usageScenario || '-'}</Descriptions.Item>
            <Descriptions.Item label="痛点">{designEvaluation?.painPoints || '-'}</Descriptions.Item>
            <Descriptions.Item label="设计方向">{designEvaluation?.designDirection || '-'}</Descriptions.Item>
            <Descriptions.Item label="材料建议">{designEvaluation?.materialSuggestion || '-'}</Descriptions.Item>
            <Descriptions.Item label="结构建议">{designEvaluation?.structureSuggestion || '-'}</Descriptions.Item>
            <Descriptions.Item label="包装建议">{designEvaluation?.packageSuggestion || '-'}</Descriptions.Item>
            <Descriptions.Item label="卖点">{designEvaluation?.sellingPoints || '-'}</Descriptions.Item>
            <Descriptions.Item label="审核意见">{designEvaluation?.reviewComment || '-'}</Descriptions.Item>
          </Descriptions>

          <Divider />

          <Typography.Title level={5}>成本/打样评估</Typography.Title>
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="样品决策">{sampleEvaluation?.decision || '-'}</Descriptions.Item>
            <Descriptions.Item label="目标售价">{sampleEvaluation?.targetPrice != null ? `$${sampleEvaluation.targetPrice}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="预估成本">{sampleEvaluation?.estimatedCost != null ? `$${sampleEvaluation.estimatedCost}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="毛利率">{sampleEvaluation?.grossMargin != null ? `${sampleEvaluation.grossMargin}%` : '-'}</Descriptions.Item>
            <Descriptions.Item label="MOQ">{sampleEvaluation?.moq ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="供应商">{sampleEvaluation?.supplier || '-'}</Descriptions.Item>
            <Descriptions.Item label="打样费用">{sampleEvaluation?.sampleCost != null ? `$${sampleEvaluation.sampleCost}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="打样周期">{sampleEvaluation?.sampleCycleDays != null ? `${sampleEvaluation.sampleCycleDays} 天` : '-'}</Descriptions.Item>
            <Descriptions.Item label="备注">{sampleEvaluation?.comment || '-'}</Descriptions.Item>
          </Descriptions>
        </>
      )}
    </Drawer>
  );
};

export default AsinReportDrawer;
