import { FC, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  ChevronDown, 
  Filter, 
  Grid3x3, 
  LayoutList, 
  Search,
  Shirt, 
  ShoppingBag 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Product } from "@shared/schema";
import Layout from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";

interface ProductCardProps {
  product: Product;
  viewMode: 'grid' | 'list';
}

const ProductCard: FC<ProductCardProps> = ({ product, viewMode }) => {
  // Format price for display, handling edge cases
  const formatPrice = (priceStr?: string) => {
    if (!priceStr) return "$0.00";
    // If it already starts with $, return as is
    if (priceStr.startsWith('$')) return priceStr;
    // Otherwise add $ prefix
    return `$${priceStr}`;
  };
  
  // Get clean values with fallbacks for all fields
  const name = product.name || "Unnamed Product";
  const sku = product.sku || "N/A";
  const sport = product.sport || "General";
  const category = product.category || "Uncategorized";
  const item = product.item || "N/A";
  const fabricOptions = product.fabricOptions || "N/A";
  const wholesalePrice = formatPrice(product.wholesalePrice);
  const cogs = formatPrice(product.cogs);
  
  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200 group h-full",
      viewMode === 'grid' ? "w-full" : "flex flex-row"
    )}>
      <div className={cn(
        "relative overflow-hidden bg-gray-100",
        viewMode === 'grid' ? "h-48" : "h-full w-48 shrink-0"
      )}>
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={name} 
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" 
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-200">
            <Shirt className="w-12 h-12 text-gray-400" />
          </div>
        )}
        <Badge className="absolute top-2 right-2 bg-primary">{wholesalePrice}</Badge>
      </div>
      
      <div className="flex flex-col flex-1">
        <CardHeader className={viewMode === 'list' ? "py-3" : ""}>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <CardDescription className="mt-1">SKU: {sku}</CardDescription>
            </div>
            <Badge variant="outline" className="ml-2">
              {sport}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className={viewMode === 'list' ? "py-2" : ""}>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              <Badge variant="secondary" className="text-xs">
                {category}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {fabricOptions}
              </Badge>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className={cn(
          "flex items-center justify-between mt-auto",
          viewMode === 'list' ? "py-3" : ""
        )}>
          <div className="text-xs text-muted-foreground">
            COGS: {cogs}
          </div>
          <Button size="sm" variant="outline" className="gap-1">
            <ShoppingBag className="w-4 h-4" /> 
            Details
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
};

const CatalogPage: FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedSport, setSelectedSport] = useState<string>("all_sports");
  const [selectedCategory, setSelectedCategory] = useState<string>("all_categories");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    select: (data: any) => data?.data || [],
  });
  
  // Get unique sports and categories for filters
  const sportsSet = new Set(products.map(p => p.sport).filter(Boolean));
  const uniqueSports = Array.from(sportsSet).sort();
  const categoriesSet = new Set(products.map(p => p.category).filter(Boolean));
  const uniqueCategories = Array.from(categoriesSet).sort();
  
  // Filter products based on selected filters and search term
  const filteredProducts = products.filter(product => {
    // Skip malformed products that might have fields in the wrong order
    if (!product.name || !product.item || typeof product.name !== 'string' || typeof product.item !== 'string') {
      return false;
    }
    
    const matchesSport = selectedSport === "all_sports" || 
      (product.sport && product.sport === selectedSport);
    const matchesCategory = selectedCategory === "all_categories" || 
      (product.category && product.category === selectedCategory);
    const matchesSearch = searchTerm 
      ? (product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         product.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())))
      : true;
    
    return matchesSport && matchesCategory && matchesSearch;
  });
  
  const clearFilters = () => {
    setSelectedSport("all_sports");
    setSelectedCategory("all_categories");
    setSearchTerm("");
  };

  return (
    <Layout user={user}>
      <div className="container px-4 py-6 mx-auto max-w-7xl">
        <div className="flex flex-col">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Product Catalog</h1>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'} 
                size="icon"
                onClick={() => setViewMode('grid')}
                className="h-9 w-9"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'default' : 'outline'} 
                size="icon"
                onClick={() => setViewMode('list')}
                className="h-9 w-9"
              >
                <LayoutList className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <p className="mt-2 text-muted-foreground">
            Browse our catalog of customizable performance apparel and sportswear.
          </p>
          
          <div className="flex flex-col gap-4 mt-6 md:flex-row">
            <div className="w-full md:w-64 shrink-0">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Filters</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="h-8 text-xs"
                  >
                    Clear all
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Sport</label>
                    <Select 
                      value={selectedSport} 
                      onValueChange={setSelectedSport}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All sports" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_sports">All sports</SelectItem>
                        {uniqueSports.map(sport => (
                          <SelectItem key={sport} value={sport}>
                            {sport}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select 
                      value={selectedCategory} 
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_categories">All categories</SelectItem>
                        {uniqueCategories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search products..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="items-center hidden gap-2 md:flex">
                  <span className="text-sm text-muted-foreground">
                    {filteredProducts.length} products
                  </span>
                </div>
              </div>
              
              {isLoading ? (
                <div className="grid gap-6 mt-6 sm:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="h-80 animate-pulse">
                      <div className="w-full h-48 bg-gray-200"></div>
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded-md"></div>
                        <div className="h-3 bg-gray-200 rounded-md"></div>
                        <div className="flex justify-between">
                          <div className="w-20 h-3 bg-gray-200 rounded-md"></div>
                          <div className="w-20 h-6 bg-gray-200 rounded-md"></div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className={cn(
                  "mt-6",
                  viewMode === 'grid' 
                    ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3" 
                    : "flex flex-col gap-4"
                )}>
                  {filteredProducts.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      viewMode={viewMode} 
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No products found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try adjusting your search or filter criteria
                  </p>
                  <Button 
                    onClick={clearFilters} 
                    variant="outline" 
                    className="mt-4"
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CatalogPage;