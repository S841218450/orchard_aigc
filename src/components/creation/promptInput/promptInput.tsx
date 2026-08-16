import { Input, Button } from "antd";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { LoadingOutlined } from "@ant-design/icons";
import { promptGenerate } from "@/actions/creation";
import "./promptInput.scss";
//带提示词优化的输入框组件
export default function PromptInput({
  prompt,
  setPrompt,
  size = "small",
  style = "智能匹配",
}: {
  prompt: string;
  setPrompt: (prompt: string) => void;
  size?: "small" | "medium" | "large";
  style?: string;
}) {
  const { TextArea } = Input;
  const [loading, setLoading] = useState(false);
  const handleOptimize = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await promptGenerate({ prompt, style });
      if (res.success) {
        setPrompt(res.data.prompt);
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="prompt-input">
      <TextArea
        className="prompt-textarea"
        value={prompt}
        autoSize={{ minRows: 4, maxRows: 8 }}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="描述你想要生成的图片..."
      />
      <div className="prompt-footer">
        <span className="prompt-count">{prompt.length} 字</span>
        <div className="prompt-btn">
          <Button
            size={size}
            type="primary"
            className="prompt-optimize-btn"
            icon={
              loading ? <LoadingOutlined size={12} /> : <Sparkles size={12} />
            }
            disabled={loading}
            onClick={handleOptimize}
          >
            {prompt ? "优化提示词" : "灵机一动"}
          </Button>
        </div>
      </div>
    </div>
  );
}
