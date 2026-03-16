import { AspectRatio } from './types';

export const ASPECT_RATIOS: { label: string; value: AspectRatio; icon: string }[] = [
  { label: '1:1', value: '1:1', icon: 'Square' },
  { label: '16:9', value: '16:9', icon: 'Monitor' },
  { label: '9:16', value: '9:16', icon: 'Smartphone' },
  { label: '4:3', value: '4:3', icon: 'Tv' },
];

export const DEFAULT_SETTINGS = {
  aspectRatio: '1:1' as AspectRatio,
  negativePrompt: '',
  enhancePrompt: true,
  safetySetting: 'BLOCK_MEDIUM_AND_ABOVE' as const,
};

export const SYSTEM_PROMPT = `Bạn là một chuyên gia về hình ảnh nghệ thuật. Khi người dùng đưa ra một ý tưởng sơ khai, hãy phân tích và mở rộng nó thành một prompt chi tiết bằng TIẾNG ANH bao gồm: chủ thể, phong cách nghệ thuật, ánh sáng, góc máy và chất liệu. Đồng thời, gợi ý các Negative Prompt phù hợp để đảm bảo ảnh không bị lỗi kỹ thuật. Trả về kết quả dưới dạng JSON với 2 trường: "enhancedPrompt" và "suggestedNegativePrompt".`;
