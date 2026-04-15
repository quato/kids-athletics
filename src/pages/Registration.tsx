import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PaymentStatusCard from "@/components/registration/PaymentStatusCard";

import { fetchEvents, createRegistration } from "@/lib/registration-api";
import type { RegistrationResponse } from "@/types/registration";

import { isRegistrationOpen } from "@/lib/registration-open";

const currentYear = new Date().getFullYear();

const childSchema = z.object({
  childName: z.string().min(2, "Введіть ім'я дитини (мінімум 2 символи)"),
  birthYear: z.coerce
    .number({ invalid_type_error: "Вкажіть рік народження" })
    .min(2000, "Рік народження не може бути раніше 2000")
    .max(currentYear, `Рік народження не може бути пізніше ${currentYear}`),
  eventId: z.coerce.number().min(1, "Оберіть подію"),
});

const schema = z.object({
  parentName: z.string().min(2, "Введіть ім'я батька/матері (мінімум 2 символи)"),
  phone: z
    .string()
    .min(10, "Введіть номер телефону")
    .regex(/^\+?[\d\s\-()]{10,20}$/, "Невірний формат телефону"),
  email: z.string().email("Невірний формат email"),
  children: z.array(childSchema).min(1, "Додайте хоча б одну дитину"),
});

type FormValues = z.infer<typeof schema>;

const Registration = () => {
  const registrationOpen = isRegistrationOpen();
  const [order, setOrder] = useState<RegistrationResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: eventsData, isLoading: eventsLoading, isError: eventsError } = useQuery({
    queryKey: ["events"],
    queryFn: fetchEvents,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      parentName: "",
      phone: "",
      email: "",
      children: [{ childName: "", birthYear: 0, eventId: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "children",
  });

  // Calculate total amount from current event selections
  const watchedChildren = form.watch("children");
  const totalAmount = eventsData
    ? watchedChildren.reduce((sum, c) => {
        const ev = eventsData.find((e) => e.id === Number(c.eventId));
        return sum + (ev?.feeAmount ?? 0);
      }, 0)
    : 0;

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      const data = await createRegistration({
        parentName: values.parentName,
        phone: values.phone,
        email: values.email,
        children: values.children.map((c) => ({
          childName: c.childName,
          birthYear: Number(c.birthYear),
          eventId: Number(c.eventId),
        })),
      });
      setOrder(data);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Сталася помилка. Спробуйте ще раз.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto max-w-lg px-4 pt-28 pb-16">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          На головну
        </Link>

        <h1 className="font-heading font-black text-3xl text-foreground mb-2">
          Реєстрація учасників
        </h1>
        <p className="text-muted-foreground mb-8">
          Kids Athletics FEST — один платіж на всіх дітей.
        </p>

        {!registrationOpen ? (
          <div className="bg-card rounded-2xl shadow-md p-8 text-center space-y-4">
            <p className="text-4xl">🗓️</p>
            <h2 className="font-heading font-bold text-xl text-foreground">
              Реєстрація ще не відкрита
            </h2>
            <p className="text-muted-foreground">
              Реєстрація на виставкові забіги відкриється{" "}
              <span className="text-primary font-semibold">19 квітня</span>.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Повернутися на головну
            </Link>
          </div>
        ) : order ? (
          /* ── Success state ── */
          <div className="space-y-5">
            <div className="bg-card rounded-2xl shadow-md p-6 space-y-3">
              <p className="text-muted-foreground text-sm">Замовлення #{order.orderId}</p>

              {/* Children list */}
              <div className="space-y-1.5">
                {order.children.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-foreground">{c.childName}</span>
                    <span className="text-muted-foreground">{c.eventName} — {c.feeAmount} грн</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-border flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Разом до сплати:</span>
                <span className="font-bold text-secondary text-xl">{order.totalAmount} грн</span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-sm text-muted-foreground">Код платежу:</span>
                <span className="font-mono font-bold text-primary text-lg tracking-wider">
                  {order.paymentCode}
                </span>
              </div>
            </div>

            <PaymentStatusCard
              orderId={order.orderId}
              paymentCode={order.paymentCode}
              totalAmount={order.totalAmount}
              children={order.children}
            />
          </div>
        ) : (
          /* ── Registration form ── */
          <div className="bg-card rounded-2xl shadow-md p-6">
            {eventsLoading && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Завантаження подій…
              </div>
            )}
            {eventsError && (
              <p className="text-destructive text-sm">
                Не вдалося завантажити список подій. Спробуйте оновити сторінку.
              </p>
            )}
            {eventsData && eventsData.length === 0 && (
              <p className="text-muted-foreground text-sm">
                Наразі немає активних подій для реєстрації.
              </p>
            )}

            {eventsData && eventsData.length > 0 && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                  {/* ── Parent fields ── */}
                  <div className="space-y-4">
                    <h3 className="font-heading font-bold text-base text-foreground">
                      Дані батька / матері
                    </h3>

                    <FormField
                      control={form.control}
                      name="parentName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ім'я та прізвище *</FormLabel>
                          <FormControl>
                            <Input placeholder="Іваненко Олена" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Телефон *</FormLabel>
                          <FormControl>
                            <Input placeholder="+380 50 123 4567" type="tel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input placeholder="email@example.com" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* ── Children list ── */}
                  <div className="space-y-4">
                    <h3 className="font-heading font-bold text-base text-foreground">
                      Діти ({fields.length})
                    </h3>

                    {fields.map((fieldItem, index) => (
                      <div
                        key={fieldItem.id}
                        className="rounded-xl border border-border p-4 space-y-3 relative"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-muted-foreground">
                            Дитина {index + 1}
                          </span>
                          {fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              aria-label="Видалити"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <FormField
                          control={form.control}
                          name={`children.${index}.childName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ім'я та прізвище дитини *</FormLabel>
                              <FormControl>
                                <Input placeholder="Іваненко Михайло" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`children.${index}.birthYear`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Рік народження *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="2015"
                                  type="number"
                                  min={2000}
                                  max={currentYear}
                                  {...field}
                                  value={field.value === 0 ? "" : field.value}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`children.${index}.eventId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Подія *</FormLabel>
                              <FormControl>
                                <select
                                  {...field}
                                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                  <option value={0} disabled>
                                    — Оберіть подію —
                                  </option>
                                  {eventsData.map((ev) => (
                                    <option key={ev.id} value={ev.id}>
                                      {ev.name} — {ev.feeAmount} грн
                                    </option>
                                  ))}
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => append({ childName: "", birthYear: 0, eventId: 0 })}
                    >
                      <PlusCircle className="w-4 h-4" />
                      Додати ще дитину
                    </Button>
                  </div>

                  {/* ── Total & submit ── */}
                  {totalAmount > 0 && (
                    <div className="flex items-center justify-between py-3 border-t border-border">
                      <span className="text-sm text-muted-foreground">Разом до сплати:</span>
                      <span className="font-bold text-secondary text-xl">{totalAmount} грн</span>
                    </div>
                  )}

                  {submitError && (
                    <p className="text-sm text-destructive">{submitError}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="w-full"
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Відправляємо…
                      </>
                    ) : (
                      `Зареєструватися${totalAmount > 0 ? ` — ${totalAmount} грн` : ""}`
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Registration;
