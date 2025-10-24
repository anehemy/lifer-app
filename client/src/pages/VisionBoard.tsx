import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Sparkles } from "lucide-react";

const categories = [
  "Personal Growth",
  "Relationships",
  "Contribution",
  "Health & Vitality",
  "Creative Expression",
  "Spiritual Growth",
  "Career & Purpose",
  "Financial Abundance",
  "Joy & Adventure",
];

export default function VisionBoard() {
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [affirmation, setAffirmation] = useState("");
  
  const utils = trpc.useUtils();
  const { data: items = [] } = trpc.vision.list.useQuery();
  
  const createItem = trpc.vision.create.useMutation({
    onSuccess: () => {
      toast.success("Vision item created!");
      utils.vision.list.invalidate();
      resetForm();
      setOpen(false);
    },
  });
  
  const updateItem = trpc.vision.update.useMutation({
    onSuccess: () => {
      toast.success("Vision item updated!");
      utils.vision.list.invalidate();
      resetForm();
      setOpen(false);
    },
  });
  
  const deleteItem = trpc.vision.delete.useMutation({
    onSuccess: () => {
      toast.success("Vision item deleted!");
      utils.vision.list.invalidate();
    },
  });

  const suggestItem = trpc.vision.suggestVisionItem.useMutation({
    onSuccess: (data) => {
      setTitle(data.title);
      setDescription(data.description);
      setAffirmation(data.affirmation);
      toast.success("AI suggestion generated!");
    },
    onError: () => {
      toast.error("Failed to generate suggestion");
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory(categories[0]);
    setAffirmation("");
    setEditingItem(null);
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    
    if (editingItem) {
      updateItem.mutate({
        id: editingItem.id,
        title,
        description,
        category,
        affirmation,
      });
    } else {
      createItem.mutate({
        title,
        description,
        category,
        affirmation,
      });
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description || "");
    setCategory(item.category);
    setAffirmation(item.affirmation || "");
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Vision Board</h1>
          <p className="text-muted-foreground">Visualize and manifest your dreams</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Vision Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit" : "Add"} Vision Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My vision..." />
              </div>
              <div>
                <Label>Category</Label>
                <div className="flex gap-2">
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => suggestItem.mutate({ category })}
                    disabled={suggestItem.isPending}
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Click <Sparkles className="h-3 w-3 inline" /> for AI-powered suggestions based on your journey
                </p>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your vision..." />
              </div>
              <div>
                <Label>Affirmation</Label>
                <Textarea value={affirmation} onChange={(e) => setAffirmation(e.target.value)} placeholder="I am..." />
              </div>
              <Button onClick={handleSave} className="w-full">
                {createItem.isPending || updateItem.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="text-xs font-medium text-primary mb-2">{item.category}</div>
                  <CardTitle className="text-xl mb-2">{item.title}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteItem.mutate({ id: item.id })}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {item.description && <p className="text-sm text-muted-foreground mb-3">{item.description}</p>}
              {item.affirmation && (
                <p className="text-sm italic text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  "{item.affirmation}"
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {items.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>Create your first vision item to start manifesting your dreams</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
