import { useState } from "react";
import { GlassScene } from "@kussetsu/react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Checkbox } from "./ui/checkbox";
import { Slider } from "./ui/slider";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/accordion";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";

const labelClass = "text-xs font-bold uppercase tracking-[0.14em] text-white/80 [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]";

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 items-start">
      <span className={labelClass}>{label}</span>
      {children}
    </section>
  );
}

export function App() {
  const [name, setName] = useState("Ada Lovelace");

  return (
    <GlassScene
      parallax={0.3}
      style={{ position: "relative", minHeight: "100vh", overflow: "hidden", background: "#3f4a2c" }}
    >
      <div className="ks-bg" />

      {/* data-kussetsu-no-capture: crisp UI on top; only .ks-bg refracts */}
      <div
        data-kussetsu-no-capture=""
        className="relative z-10 flex flex-col gap-10 p-[clamp(2rem,6vw,5rem)] text-white"
      >
        <header>
          <h1 className="m-0 text-[clamp(1.8rem,4vw,2.6rem)] font-bold tracking-tight [text-shadow:0_2px_18px_rgba(0,0,0,0.5)]">
            Kussetsu UI · React
          </h1>
          <p className="mt-2 text-white/90 [text-shadow:0_1px_12px_rgba(0,0,0,0.6)]">
            shadcn components, rendered as live glass on <code>@kussetsu/react</code>.
          </p>
        </header>

        <Section label="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Delete</Button>
          </div>
        </Section>

        <Section label="Badges">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </Section>

        <Section label="Switches">
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]">
              <Switch defaultChecked /> Notifications
            </label>
            <label className="flex items-center gap-3 [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]">
              <Switch /> Auto-sync
            </label>
          </div>
        </Section>

        <Section label="Input">
          <div className="w-80 max-w-full">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
        </Section>

        <Section label="Card">
          <Card className="w-96 max-w-full">
            <CardHeader>
              <CardTitle>Upgrade to Pro</CardTitle>
              <CardDescription>Unlimited glass components for React.</CardDescription>
            </CardHeader>
            <CardContent>$8 / month, billed annually. Cancel anytime.</CardContent>
            <CardFooter>
              <Button size="sm">Upgrade</Button>
              <Button size="sm" variant="ghost">
                Maybe later
              </Button>
            </CardFooter>
          </Card>
        </Section>

        <Section label="Dialog">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Edit profile</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit profile</DialogTitle>
                <DialogDescription>Make changes to your profile. Click save when you're done.</DialogDescription>
              </DialogHeader>
              <div className="mt-4 flex flex-col gap-1.5">
                <span className="text-sm font-medium text-white/85">Display name</span>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost" size="sm">
                    Cancel
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button size="sm">Save changes</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Section>

        <Section label="Tabs">
          <Tabs defaultValue="account" className="w-96 max-w-full">
            <TabsList>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>
            <TabsContent value="account" className="pt-3 text-white/85">Manage your account here.</TabsContent>
            <TabsContent value="password" className="pt-3 text-white/85">Change your password here.</TabsContent>
          </Tabs>
        </Section>

        <Section label="Select & Popover — overlays">
          <div className="flex flex-wrap items-center gap-4">
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Pick a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
                <SelectItem value="cherry">Cherry</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="secondary">Open popover</Button>
              </PopoverTrigger>
              <PopoverContent>A glass popover — Radix-positioned, motion-animated.</PopoverContent>
            </Popover>
          </div>
        </Section>

        <Section label="Checkbox · Radio · Slider · Progress">
          <label className="flex items-center gap-2.5">
            <Checkbox defaultChecked /> Accept terms
          </label>
          <RadioGroup defaultValue="a" className="flex gap-5">
            <label className="flex items-center gap-2">
              <RadioGroupItem value="a" /> Option A
            </label>
            <label className="flex items-center gap-2">
              <RadioGroupItem value="b" /> Option B
            </label>
          </RadioGroup>
          <div className="w-80 max-w-full pt-1">
            <Slider defaultValue={[40]} max={100} />
          </div>
          <div className="w-80 max-w-full">
            <Progress value={62} />
          </div>
        </Section>

        <Section label="Accordion · Avatar">
          <Accordion type="single" collapsible className="w-96 max-w-full">
            <AccordionItem value="1">
              <AccordionTrigger>Is every surface glass?</AccordionTrigger>
              <AccordionContent>Yes — each refracts the wallpaper behind it.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="2">
              <AccordionTrigger>Is it accessible?</AccordionTrigger>
              <AccordionContent>Radix owns keyboard, focus, and ARIA.</AccordionContent>
            </AccordionItem>
          </Accordion>
          <Avatar>
            <AvatarFallback>KU</AvatarFallback>
          </Avatar>
        </Section>
      </div>
    </GlassScene>
  );
}
