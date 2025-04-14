import { useState } from "react";
import { useCampBudget, useCamp } from "@/hooks/use-camps";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertBudgetItemSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, PlusCircle, DollarSign, Wallet } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";

// Extend the schema for client-side validation
const budgetItemFormSchema = insertBudgetItemSchema.extend({
  dueDate: z.coerce.date().optional(),
});

type BudgetItemFormValues = z.infer<typeof budgetItemFormSchema>;

interface CampBudgetProps {
  campId: number;
}

export default function CampBudget({ campId }: CampBudgetProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { data: budgetItems, isLoading, error } = useCampBudget(campId);
  const { data: camp } = useCamp(campId);
  const { toast } = useToast();

  // Calculate totals
  const income = budgetItems?.filter(item => item.type === "income").reduce((sum, item) => sum + item.amount, 0) || 0;
  const expenses = budgetItems?.filter(item => item.type === "expense").reduce((sum, item) => sum + item.amount, 0) || 0;
  const balance = income - expenses;
  const totalBudget = camp?.totalBudget || 0;
  const budgetUtilizationPercentage = totalBudget > 0 ? Math.min(100, Math.round((expenses / totalBudget) * 100)) : 0;

  const form = useForm<BudgetItemFormValues>({
    resolver: zodResolver(budgetItemFormSchema),
    defaultValues: {
      campId,
      category: "lodging",
      description: "",
      amount: 0,
      type: "expense",
      dueDate: undefined,
      paid: false,
      paidDate: undefined,
      receiptUrl: "",
      notes: "",
    },
  });

  const onSubmit = async (values: BudgetItemFormValues) => {
    try {
      await apiRequest("POST", `/api/camps/${campId}/budget`, values);
      toast({
        title: "Success",
        description: "Budget item added successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/camps/${campId}/budget`] });
      setIsAddDialogOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add budget item",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-600">Error loading budget data</h3>
          <p className="mt-2 text-muted-foreground">
            {error instanceof Error ? error.message : "An unknown error occurred"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
              <h3 className="text-2xl font-bold mt-1">${totalBudget.toLocaleString()}</h3>
            </div>
            <div className="bg-primary-50 p-2 rounded-md">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xs text-muted-foreground font-medium">Camp budget allocation</span>
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Income</p>
              <h3 className="text-2xl font-bold mt-1 text-success">${income.toLocaleString()}</h3>
            </div>
            <div className="bg-green-50 p-2 rounded-md">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xs text-success font-medium">+${income.toLocaleString()} received</span>
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
              <h3 className="text-2xl font-bold mt-1 text-orange-500">${expenses.toLocaleString()}</h3>
            </div>
            <div className="bg-orange-50 p-2 rounded-md">
              <DollarSign className="h-5 w-5 text-orange-500" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xs text-orange-500 font-medium">-${expenses.toLocaleString()} spent</span>
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Budget Utilization</p>
              <h3 className="text-2xl font-bold mt-1">{budgetUtilizationPercentage}%</h3>
            </div>
            <div className="bg-primary-50 p-2 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <Progress value={budgetUtilizationPercentage} className="h-2" />
          </div>
        </div>
      </div>

      {/* Budget Items */}
      <Card>
        <div className="bg-white px-4 py-5 border-b sm:px-6 rounded-t-lg flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Budget Items</h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Track all income and expenses for the camp.
            </p>
          </div>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Add Item
          </Button>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-muted">
              <thead className="bg-muted">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Due Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-muted">
                {budgetItems && budgetItems.length > 0 ? (
                  budgetItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{item.description}</div>
                        {item.notes && (
                          <div className="text-xs text-muted-foreground mt-1">{item.notes}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.type === "income"
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          item.type === "income" ? "text-success" : "text-orange-500"
                        }`}>
                          ${item.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.dueDate ? format(new Date(item.dueDate), "MMM d, yyyy") : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.paid
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {item.paid ? "Paid" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                      No budget items found. Add your first budget item to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Budget Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Budget Item</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="income" id="income" />
                          <label htmlFor="income" className="text-sm font-medium">Income</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="expense" id="expense" />
                          <label htmlFor="expense" className="text-sm font-medium">Expense</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="lodging">Lodging</SelectItem>
                          <SelectItem value="food">Food</SelectItem>
                          <SelectItem value="transportation">Transportation</SelectItem>
                          <SelectItem value="staffing">Staffing</SelectItem>
                          <SelectItem value="equipment">Equipment</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="registration">Registration</SelectItem>
                          <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Venue rental payment" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          value={field.value instanceof Date ? field.value.toISOString().substring(0, 10) : field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paid"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Payment Status</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "true")}
                        defaultValue={field.value ? "true" : "false"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Payment status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="false">Pending</SelectItem>
                          <SelectItem value="true">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional notes about this item"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Item
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
