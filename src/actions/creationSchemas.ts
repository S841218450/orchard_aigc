import { z } from "zod";

// ==================== 创作参数验证 Schema ====================

/** 创建作品入参 */
export const createWorkSchema = z.object({
  type: z.enum(["image", "video"]),
  prompt: z.string().min(1, "请输入创作描述"),
  model: z.string().optional(),
  params: z
    .object({
      style: z.string().optional(),
      imageProportion: z.string().optional(),
      imageQuality: z.string().optional(),
      imageCount: z.number().optional(),
      imageQty: z.number().optional(),
      referenceIntensity: z.number().optional(),
    })
    .optional(),
  originImageList: z
    .array(z.object({ id: z.number(), url: z.string() }))
    .optional(),
});

/** 文生图提交入参 */
export const textToImageSchema = z.object({
  prompt: z.string().min(1, "请输入创作描述"),
  model: z.string(),
  params: z.object({
    style: z.string(),
    imageProportion: z.string(),
    imageQuality: z.string(),
    imageCount: z.number(),
  }),
});

/** 图生图提交入参 */
export const imageToImageSchema = z.object({
  prompt: z.string().min(1, "请输入创作描述"),
  model: z.string(),
  params: z.object({
    imageQty: z.number(),
    referenceIntensity: z.number(),
  }),
  originImageList: z
    .array(z.object({ id: z.number(), url: z.string() }))
    .optional(),
});

// ==================== 接口入参类型 ====================

export type CreateWorkInput = z.infer<typeof createWorkSchema>;
export type SubmitTextToImageInput = z.infer<typeof textToImageSchema>;
export type SubmitImageToImageInput = z.infer<typeof imageToImageSchema>;
// ==================== 创作表单提交数据类型 ====================

/** 文生图表单提交数据 */
export interface TextToImageFormData {
  type: "image";
  prompt: string;
  model: string;
  params: {
    style: string;
    imageProportion: string;
    imageQuality: string;
    imageCount: number;
  };
}

/** 图生图表单提交数据 */
export interface ImageToImageFormData {
  type: "image";
  prompt: string;
  params: {
    imageQty: number; //生成张数
    referenceIntensity: number; // 参考图片强度：0-弱 1-中 2-强
  };
  originImageList: { id: number; url: string }[];
}

/** 营销图表单提交数据 */
export interface MarketingImageFormData {
  title: string;
  subtitle: string;
  style: string;
}

/** 创作助手各表单提交数据的联合类型 */
export type GenerateWorkData =
  | TextToImageFormData
  | ImageToImageFormData
  | MarketingImageFormData;
