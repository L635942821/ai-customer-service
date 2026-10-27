import type { PromptTemplate } from '../types';

/**
 * 前端提示词模板（用于 Sidebar 展示与默认值）。
 * 运行时 App 会尝试从后端 /api/prompts 拉取，保证与后端一致；
 * 拉取失败时回退到这里的本地副本。
 */
export const LOCAL_PROMPTS: PromptTemplate[] = [
  { id: 'cs', name: '智能客服', emoji: '🎧', desc: '通用售前售后咨询助手', system: '' },
  { id: 'aftersale', name: '售后安抚', emoji: '🤝', desc: '处理投诉、安抚情绪', system: '' },
  { id: 'product', name: '产品咨询', emoji: '📦', desc: '介绍产品参数与卖点', system: '' },
  { id: 'translate', name: '翻译助手', emoji: '🌐', desc: '中英互译与润色', system: '' },
  { id: 'copywriting', name: '文案生成', emoji: '✍️', desc: '营销文案与话术', system: '' },
];

/** 输入框占位提示语，随模板变化。 */
export const PLACEHOLDERS: Record<string, string> = {
  cs: '您好，我是小伟，请问有什么可以帮您？',
  aftersale: '很抱歉给您带来不便，请描述您遇到的问题…',
  product: '想了解哪款产品？告诉小伟您的需求～',
  translate: '输入要翻译的内容，小伟帮您中英互译',
  copywriting: '描述您的产品或活动，小伟帮您写文案',
};

/** 落地页欢迎标题。 */
export const WELCOME_TITLE = '欢迎体验小伟对话，今天你有什么新想法？';

/** 落地页快捷建议（点击填入输入框）。 */
export const SUGGESTIONS: { icon: string; label: string; text: string }[] = [
  { icon: '🛒', label: '退换货政策', text: '我想了解一下你们的退换货政策是怎样的？' },
  { icon: '🚚', label: '发货时效', text: '下单之后大概多久能发货？' },
  { icon: '🧾', label: '开发票', text: '怎么申请开具发票？' },
  { icon: '💬', label: '转人工', text: '帮我转接人工客服' },
];

/** 对话区快捷提示词：点击后填入输入框并立即生成对话。 */
export const PROMPT_SHORTCUTS: { icon: string; label: string; text: string }[] = [
  { icon: '🛒', label: '退换货', text: '我想退换货，具体流程是怎样的？' },
  { icon: '🚚', label: '查物流', text: '我的订单发货了吗？大概几天能到？' },
  { icon: '🧾', label: '开发票', text: '请告诉我怎么开具发票。' },
  { icon: '💰', label: '运费', text: '你们运费怎么收？满多少包邮？' },
  { icon: '🛠️', label: '保修', text: '商品坏了在保修期内怎么维修？' },
  { icon: '🌐', label: '翻译', text: '帮我把这句话翻译成英文：今天天气真好。' },
  { icon: '✍️', label: '写文案', text: '帮我为一款保温杯写一句营销文案。' },
  { icon: '🙋', label: '转人工', text: '帮我转接人工客服。' },
];
