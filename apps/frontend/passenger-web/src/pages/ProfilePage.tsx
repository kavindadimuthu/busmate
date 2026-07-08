import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Mail, Pencil, ShieldCheck, User as UserIcon, X } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UsersControllerService } from "@busmate/api-client-user";
import { useAuth } from "@/lib/auth/AuthContext";
import { extractErrorMessage } from "@/lib/auth/errorMessage";

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores are allowed"),
  phoneNumber: z.string().trim().min(7, "Enter a valid phone number"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function initialsOf(name: string | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: user?.fullName ?? "",
      username: user?.username ?? "",
      phoneNumber: user?.phoneNumber ?? "",
    },
  });

  if (!user) {
    return null;
  }

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      await UsersControllerService.updateUser(user.userId!, values);
      await refreshUser();
      toast.success("Profile updated");
      setIsEditing(false);
    } catch (error) {
      toast.error(extractErrorMessage(error, "Could not update your profile. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelEdit = () => {
    form.reset({ fullName: user.fullName ?? "", username: user.username ?? "", phoneNumber: user.phoneNumber ?? "" });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 md:pt-32 pb-16 md:pb-24 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="shadow-card border border-border">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
              <Avatar className="h-20 w-20 text-xl">
                <AvatarFallback className="bg-gradient-primary text-white text-xl font-semibold">
                  {initialsOf(user.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{user.fullName}</h1>
                  <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
                    <Mail className="h-4 w-4" /> {user.email}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  <Badge variant="secondary" className="capitalize">
                    <UserIcon className="h-3 w-3 mr-1" /> {user.userType}
                  </Badge>
                  <Badge variant="secondary" className="capitalize">
                    {user.accountStatus}
                  </Badge>
                  {user.isEmailVerified && (
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                      <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Profile Information</CardTitle>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full name</FormLabel>
                        <FormControl>
                          <Input disabled={!isEditing} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input disabled={!isEditing} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone number</FormLabel>
                        <FormControl>
                          <Input disabled={!isEditing} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input value={user.email} disabled readOnly />
                    </FormControl>
                  </FormItem>

                  {isEditing && (
                    <div className="flex gap-3 pt-2">
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                      <Button type="button" variant="outline" onClick={cancelEdit} disabled={isSubmitting}>
                        <X className="h-4 w-4" /> Cancel
                      </Button>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProfilePage;
