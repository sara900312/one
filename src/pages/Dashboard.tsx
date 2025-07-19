import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { LogOut, Package, ShoppingBag, Store } from "lucide-react";

// Products Components
import AddProductAI from "@/components/products/AddProductAI";
import AddProductManual from "@/components/products/AddProductManual";
import ProductsList from "@/components/products/ProductsList";

// Orders Components
import OrdersStatistics from "@/components/orders/OrdersStatistics";
import OrdersList from "@/components/orders/OrdersList";

// Stores Components
import CreateStore from "@/components/stores/CreateStore";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleLogout = async () => {
    await logout();
    toast.success("تم تسجيل الخروج بنجاح");
  };

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const getUserRoleText = () => {
    switch (user?.role) {
      case "admin":
        return "مدير النظام";
      case "assistant":
        return "مساعد";
      case "store":
        return "متجر";
      default:
        return "مستخدم";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="text-ar">
              <h1 className="text-2xl font-bold">
                نظام إدارة المنتجات والطلبات
              </h1>
              <p className="text-muted-foreground">
                مرحباً {getUserRoleText()}
                {user?.store_name && ` - ${user.store_name}`}
              </p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="text-ar"
            >
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
            <TabsTrigger value="orders" className="text-ar">
              <ShoppingBag className="w-4 h-4 ml-2" />
              الطلبات
            </TabsTrigger>

            {(user?.role === "admin" || user?.role === "assistant") && (
              <TabsTrigger value="products" className="text-ar">
                <Package className="w-4 h-4 ml-2" />
                المنتجات
              </TabsTrigger>
            )}

            {user?.role === "admin" && (
              <TabsTrigger value="stores" className="text-ar">
                <Store className="w-4 h-4 ml-2" />
                المتاجر
              </TabsTrigger>
            )}
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <OrdersStatistics refreshTrigger={refreshTrigger} />
            <OrdersList refreshTrigger={refreshTrigger} />
          </TabsContent>

          {/* Products Tab */}
          {(user?.role === "admin" || user?.role === "assistant") && (
            <TabsContent value="products" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AddProductAI onProductAdded={triggerRefresh} />
                <AddProductManual onProductAdded={triggerRefresh} />
              </div>
              <ProductsList refreshTrigger={refreshTrigger} />
            </TabsContent>
          )}

          {/* Stores Tab */}
          {user?.role === "admin" && (
            <TabsContent value="stores" className="space-y-6">
              <CreateStore onStoreCreated={triggerRefresh} />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
