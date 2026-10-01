import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useColorTheme } from "@/components/use-color-theme";

function Toaster(props: ToasterProps) {
  const theme = useColorTheme();
  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast bg-card text-card-foreground border-border font-sans",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-secondary text-secondary-foreground",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
