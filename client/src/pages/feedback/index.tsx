import { useState, type ClipboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Input, Select, Upload, message } from 'antd';
import { CloseOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';

/** 问题类型候选（可按业务调整） */
const ISSUE_TYPES = [
  { value: 'bug', label: '功能异常' },
  { value: 'ui', label: '界面问题' },
  { value: 'perf', label: '性能问题' },
  { value: 'feature', label: '需求建议' },
  { value: 'other', label: '其他' },
];

const MAX_FILES = 8;
const MAX_SIZE_MB = 20;
const ACCEPT = '.zip,.rar,.pdf,.xls,.xlsx,.doc,.docx,.jpg,.jpeg,.png,.gif,.svg';

/**
 * 我要反馈页：工单反馈表单（问题类型 / 问题描述 / 图片与附件）。
 * 路由注册见同目录 routes.tsx。
 */
export default function FeedbackPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  /** 手动控制上传：限制个数与大小，不自动请求 */
  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    if (fileList.length >= MAX_FILES) {
      message.warning(`最多上传 ${MAX_FILES} 个附件`);
      return Upload.LIST_IGNORE;
    }
    if (file.size / 1024 / 1024 > MAX_SIZE_MB) {
      message.warning(`${file.name} 超过 ${MAX_SIZE_MB}MB，已忽略`);
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  /** 粘贴图片到描述框 → 追加为附件（对应原型红字提示） */
  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const images = Array.from(e.clipboardData?.items ?? [])
      .filter((it) => it.kind === 'file' && it.type.startsWith('image/'))
      .map((it) => it.getAsFile())
      .filter((f): f is File => Boolean(f));
    if (images.length === 0) return;
    e.preventDefault();
    const next = [...fileList];
    let added = 0;
    images.forEach((f, i) => {
      if (next.length >= MAX_FILES) return;
      next.push({
        uid: `paste-${Date.now()}-${i}`,
        name: f.name || `粘贴图片-${next.length + 1}.png`,
        status: 'done',
        size: f.size,
        type: f.type,
      });
      added += 1;
    });
    setFileList(next);
    if (added > 0) message.success(`已粘贴 ${added} 张图片到附件`);
  };

  const handleClear = () => {
    form.resetFields();
    setFileList([]);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // TODO: 接入提交工单接口
      console.log('提交工单：', values, fileList);
      message.success('工单提交成功，我们会尽快处理');
      handleClear();
    } catch {
      // 校验未通过，antd 已就地提示
    }
  };

  return (
    <div className="min-h-full bg-gray-100 py-6 px-4">
      <div className="mx-auto max-w-[880px] bg-white rounded-lg shadow-sm overflow-hidden">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 h-11 bg-[#f5f6f8] border-b border-black/5">
          <span className="font-semibold text-[15px]">我要反馈</span>
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={() => navigate('/chat')}
          />
        </div>

        {/* 问候区 */}
        <div className="bg-[#eef4fd] px-5 py-4">
          <div className="font-semibold text-[15px] mb-1">尊敬的用户，您好！</div>
          <p className="text-[13px] leading-6 text-gray-700">
            请详细描述您的需求或遇到的问题，这能帮助我们更快地为您解决。您可以这样描述：
            <span className="text-blue-500">
              我的具体需求是什么，或我遇到了什么问题、问题出现之前我做了什么操作（比如点了某个按钮、提交了某些信息）、页面有什么反应（比如页面的反应、报错提示的文字），以及完整的页面截图等。
            </span>
          </p>
        </div>

        {/* 表单区 */}
        <Form form={form} layout="vertical" className="px-5 py-4">
          <Form.Item
            label="问题类型"
            name="issueType"
            rules={[{ required: true, message: '请选择工单问题类型' }]}
          >
            <Select placeholder="请选择工单问题类型" options={ISSUE_TYPES} />
          </Form.Item>

          <Form.Item
            name="description"
            rules={[{ required: true, message: '请详细描述遇到的问题' }]}
            label={
              <span>
                问题描述
                <span className="block font-normal text-[12px] text-gray-400 mt-0.5">
                  请详细描述一下遇到的情况，建议附上整屏截图，
                  <span className="text-red-500 underline">
                    您可通过粘贴图片到输入框中来上传图片
                  </span>
                </span>
              </span>
            }
          >
            <Input.TextArea
              rows={6}
              maxLength={500}
              showCount
              placeholder="请描述您的问题或需求…"
              onPaste={handlePaste}
            />
          </Form.Item>

          <Form.Item label="图片与附件">
            <div>
              <Upload
                multiple
                accept={ACCEPT}
                fileList={fileList}
                beforeUpload={beforeUpload}
                onChange={({ fileList: fl }) => setFileList(fl)}
              >
                <Button icon={<UploadOutlined />}>上传附件</Button>
              </Upload>
              <div className="text-[12px] text-gray-400 mt-2">
                选择文件。支持上传多个附件,最多不超过{MAX_FILES}个
              </div>
              <div className="text-[12px] text-gray-400">
                允许文件类型：zip,rar,pdf,excel,word,jpg,png,gif,svg且不超过{MAX_SIZE_MB}MB
              </div>
            </div>
          </Form.Item>
        </Form>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 bg-[#fafbfc] border-t border-black/5">
          <Button type="link" onClick={() => message.info('历史反馈功能开发中')}>
            历史反馈
          </Button>
          <Button onClick={handleClear}>清空</Button>
          <Button type="primary" onClick={handleSubmit}>
            提交工单
          </Button>
        </div>
      </div>
    </div>
  );
}
