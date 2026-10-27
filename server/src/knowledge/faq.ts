/**
 * 极简 FAQ 知识库 + 关键词检索（幻觉兜底）。
 * 一期用关键词打分匹配，命中的问答对会注入 system prompt 作为「参考资料」。
 * 二期可替换为向量检索（embedding + 相似度）。
 */

export interface FaqEntry {
  keywords: string[];
  question: string;
  answer: string;
}

export const FAQ: FaqEntry[] = [
  {
    keywords: ['退货', '退款', '退换', '退', '不想要', '七天'],
    question: '如何申请退换货？',
    answer:
      '支持 7 天无理由退货。请在「我的订单」中找到对应订单，点击「申请售后」，选择退货原因并提交，我们会在 1 个工作日内审核。商品需保持完好、配件齐全。',
  },
  {
    keywords: ['发货', '多久', '几天', '什么时候发', '物流', '快递', '到货', '配送'],
    question: '下单后多久发货？',
    answer:
      '现货商品在下单后 48 小时内发货，默认使用顺丰或京东快递。偏远地区可能延迟 1-2 天，发货后可在订单详情查看物流单号。',
  },
  {
    keywords: ['发票', '开票', '报销', '增值税'],
    question: '如何开发票？',
    answer:
      '支持电子普通发票和增值税专用发票。下单时在结算页勾选「开具发票」并填写抬头信息；若已下单，可在订单详情申请补开，电子发票将在 3 个工作日内发送至您的邮箱。',
  },
  {
    keywords: ['投诉', '差评', '态度', '举报', '不满意', '客服'],
    question: '如何投诉或反馈问题？',
    answer:
      '您可拨打客服热线 400-000-0000（9:00-21:00），或在 App「我的-帮助与反馈」提交投诉，我们承诺 24 小时内响应并跟进处理。',
  },
  {
    keywords: ['运费', '邮费', '包邮', '快递费'],
    question: '运费如何收取？',
    answer:
      '全场满 99 元包邮，未满 99 元收取 8 元基础运费。新疆、西藏、内蒙古等偏远地区另计，具体以结算页显示为准。',
  },
  {
    keywords: ['支付', '付款', '微信支付', '支付宝', '信用卡', '分期'],
    question: '支持哪些支付方式？',
    answer:
      '支持微信支付、支付宝、银联卡以及主流信用卡。部分商品支持花呗 / 信用卡 3-12 期分期，分期手续费以支付页面显示为准。',
  },
  {
    keywords: ['优惠券', '折扣', '活动', '满减', '促销'],
    question: '优惠券如何使用？',
    answer:
      '在结算页「优惠」栏选择可用优惠券即可抵扣。优惠券不可叠加使用（平台券与店铺券可各用一张），过期自动失效，具体规则见券面说明。',
  },
  {
    keywords: ['保修', '质保', '坏了', '维修', '售后', '质量问题'],
    question: '商品保修政策是怎样的？',
    answer:
      '大多数商品提供 1 年质保（以商品详情页为准）。非人为损坏可在保修期内免费维修；收到商品 15 天内出现质量问题可申请换货，运费由我们承担。',
  },
  {
    keywords: ['会员', '积分', '等级', 'vip'],
    question: '会员积分如何计算？',
    answer:
      '每消费 1 元累计 1 积分，积分可在「积分商城」兑换优惠券或礼品。会员等级根据近 12 个月消费额划分，等级越高享受的折扣与专属权益越多。',
  },
  {
    keywords: ['人工', '转人工', '真人', '客服电话', '联系'],
    question: '如何转接人工客服？',
    answer:
      '在对话框输入「转人工」即可为您转接在线客服，或拨打客服热线 400-000-0000（服务时间 9:00-21:00）。',
  },
];

/** 关键词打分匹配，返回最相关的 Top N 条 FAQ 拼成的文本。 */
export function searchFaq(query: string, topN = 3): string {
  const q = query.toLowerCase();
  const scored = FAQ.map((entry) => {
    let score = 0;
    for (const kw of entry.keywords) {
      if (q.includes(kw.toLowerCase())) score += kw.length >= 2 ? 2 : 1;
    }
    return { entry, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  if (scored.length === 0) return '';
  return scored
    .map((s, i) => `${i + 1}. Q: ${s.entry.question}\n   A: ${s.entry.answer}`)
    .join('\n');
}
