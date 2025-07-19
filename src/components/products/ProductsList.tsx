import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Product, ApiResponse } from "@/types/database";
import { toast } from "sonner";
import { Package, Edit, Eye, CheckCircle } from "lucide-react";
import { handleError } from "@/utils/errorHelpers";

interface ProductsListProps {
  refreshTrigger: number;
}

const ProductsList: React.FC<ProductsListProps> = ({ refreshTrigger }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, [refreshTrigger, user]);

  const fetchProducts = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_products", {
        p_user_id: user.id,
      });

      if (error) {
        await handleError("تحميل المنتجات", error, {
          context: { userId: user.id },
          fallbackMessage: "فشل في تحميل المنتجات",
        });
        return;
      }

      setProducts((data || []) as Product[]);
    } catch (error) {
      await handleError("تحميل المنتجات", error, {
        context: { userId: user.id },
        fallbackMessage: "حدث خطأ في تحميل المنتجات",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePublishProduct = async (productId: string) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.rpc("publish_product", {
        p_product_id: productId,
        p_user_id: user.id,
      });

      if (error) {
        await handleError("نشر المنتج", error, {
          context: { productId, userId: user.id },
          fallbackMessage: "فشل في نشر المنتج",
        });
        return;
      }

      const response = data as ApiResponse;
      if (response?.success) {
        toast.success(response.message || "تم نشر المنتج بنجاح");
        fetchProducts();
      } else {
        await handleError(
          "نشر المنتج",
          { message: response?.error },
          {
            context: { productId, response },
            fallbackMessage: "فشل في نشر المنتج",
          },
        );
      }
    } catch (error) {
      await handleError("نشر المنتج", error, {
        context: { productId, userId: user.id },
        fallbackMessage: "حدث خطأ في نشر المنتج",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-success";
      case "draft":
        return "bg-warning";
      default:
        return "bg-muted";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "published":
        return "منشور";
      case "draft":
        return "مسودة";
      default:
        return "غير محدد";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-ar">جاري تحميل المنتجات...</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-ar flex items-center gap-2">
          <Package className="w-5 h-5" />
          قائمة المنتجات ({products.length})
        </CardTitle>
        <CardDescription className="text-ar">
          جميع المنتجات المتاحة حسب صلاحياتك
        </CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-ar">
            لا توجد منتجات متاحة
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <Card key={product.id} className="border">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-ar text-lg">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground text-ar">
                        {product.store_name}
                      </p>
                      {product.description && (
                        <p className="text-sm text-ar mt-2">
                          {product.description}
                        </p>
                      )}
                    </div>
                    <Badge className={getStatusColor(product.status)}>
                      {getStatusText(product.status)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-ar">
                      <span className="font-medium">السعر: </span>
                      <span>{product.price.toLocaleString("ar-SA")} ريال</span>
                    </div>
                    <div className="text-ar">
                      <span className="font-medium">الكمية: </span>
                      <span>{product.quantity}</span>
                    </div>
                    {product.discount_amount > 0 && (
                      <div className="text-ar">
                        <span className="font-medium">التخفيض: </span>
                        <span>
                          {product.discount_amount.toLocaleString("ar-SA")} ريال
                        </span>
                      </div>
                    )}
                    {product.final_price && (
                      <div className="text-ar">
                        <span className="font-medium">السعر النهائي: </span>
                        <span>
                          {product.final_price.toLocaleString("ar-SA")} ريال
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {product.can_edit &&
                      product.status === "draft" &&
                      user?.role === "admin" && (
                        <Button
                          size="sm"
                          onClick={() => handlePublishProduct(product.id)}
                          className="text-ar"
                        >
                          <CheckCircle className="w-4 h-4 ml-2" />
                          نشر المنتج
                        </Button>
                      )}

                    {product.can_edit && (
                      <Button variant="outline" size="sm" className="text-ar">
                        <Edit className="w-4 h-4 ml-2" />
                        تعديل
                      </Button>
                    )}

                    <Button variant="ghost" size="sm" className="text-ar">
                      <Eye className="w-4 h-4 ml-2" />
                      عرض التفاصيل
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductsList;
