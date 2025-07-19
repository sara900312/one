import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArabicTextarea } from "@/components/ui/arabic-textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { addProductAI } from "@/utils/productHelpers";
import { handleError } from "@/utils/errorHelpers";

interface AddProductAIProps {
  onProductAdded: () => void;
}

const AddProductAI: React.FC<AddProductAIProps> = ({ onProductAdded }) => {
  const [aiInput, setAiInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!aiInput.trim()) {
      toast.error("يرجى إدخال وصف المنتج");
      return;
    }

    if (!user?.id) {
      toast.error("خطأ في المصادقة");
      return;
    }

    setLoading(true);

    try {
      const response = await addProductAI({
        p_ai_input: aiInput.trim(),
        p_created_by: user.id,
      });

      if (response?.success) {
        toast.success(response.message || "تم إضافة المنتج بنجاح");
        setAiInput("");
        onProductAdded();
      } else {
        await handleError(
          "إضافة منتج بالذكاء الاصطناعي",
          { message: response?.error },
          {
            context: { aiInput: aiInput.substring(0, 100) + "..." },
            fallbackMessage: "فشل في إضافة المنتج",
          },
        );
      }
    } catch (error) {
      await handleError("إضافة منتج بالذكاء الاصطناعي", error, {
        context: { aiInput: aiInput.substring(0, 100) + "..." },
        fallbackMessage: "حدث خطأ غير متوقع أثناء معالجة المنتج",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-ar flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          إضافة منتج بالذكاء الاصطناعي
        </CardTitle>
        <CardDescription className="text-ar">
          اكتب وصف المنتج وسيقوم الذكاء الاصطناعي بتحليل البيانات تلقائياً
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAISubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-input" className="text-ar">
              وصف المنتج (اسم المنتج، السعر، الكمية، الوصف، اسم المتجر)
            </Label>
            <ArabicTextarea
              id="ai-input"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="مثال: هاتف آيفون 14 برو بسعر 3500 ريال، متوفر 10 قطع، هاتف ذكي مع كاميرا متطورة، متجر التكنولوجيا الحديثة"
              className="min-h-[120px]"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full text-ar"
            disabled={loading || !aiInput.trim()}
          >
            {loading ? "جاري المعالجة..." : "إضافة بالذكاء الاصطناعي"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddProductAI;
