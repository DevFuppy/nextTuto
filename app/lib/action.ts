"use server";

import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { error } from "console";

const sql = neon(process.env.POSTGRES_URL!);

const FormSchema = z.object({
  id: z.string(),

  ////alt 1: <=0 and "" will output the same error, which is "gt", only NaN will be solely picked out
  // amount: z.coerce.number({invalid_type_error:'needs to be \'number\' '}).gt(0,"that means you didn't fill out a number or the number is smaller than or equal to 0"),

//// alt 2: It can distinguish "" from <= 0, and also "" from NaN
// Warning: `.coerce` is not a schema. It's a ZodEffects wrapper that applies a data effect,
// in this case essentially `Number(...)` without validation. If you use `coerce`,
// `undefined` will get converted to `NaN` and then passed into the inner `number()` schema,
// which triggers `invalid_type_error` instead of `required_error`—not what we want here. 
  amount: z.preprocess(v=>v===''?undefined:Number(v), z.number({
    invalid_type_error:'要是數字',
    required_error:'要填'
  }).gt(0,"要大於零")),

  //alt 3: It can distinguish "", NaN, and <=0, which is the most detailed
  // amount: z
  //   .string()
  //   .min(1, "at least oneword")
  //   .transform((v) => Number(v))
  //   .pipe(
  //     z
  //       .number({ invalid_type_error: "please filled out a number" })
  //       .gt(0, "needs to > 0")
  //   ),

  customerId: z.string({ required_error: "no id" }),
  status: z.enum(["pending", "paid"], { required_error: "要填阿幹嘛?" }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message: string | null;
};

export async function createInvoice(formState: State, formdata: FormData) {
  //   const rawFormData = {
  //     amount: formdata.get('amount'),
  //     customerId: formdata.get('customerId'),
  //     status: formdata.get('status'),
  //   };

  //  const {customerId,amount,status} = CreateInvoice.parse({
  //     amount: formdata.get('amount'),
  //     customerId: formdata.get('customerId'),
  //     status: formdata.get('status'),
  //   })

  // const rawFormData = Object.fromEntries(formdata)

  const validation = CreateInvoice.safeParse(Object.fromEntries(formdata));

  if (!validation.success) {
    // console.log(validation.error?.flatten().fieldErrors);

    const newFormState = { ...formState };

    newFormState.errors = validation.error?.flatten().fieldErrors;
    newFormState.message = "invoice creating failed";

    // console.log(formState)

    return newFormState;
  }

  const { customerId, amount, status } = validation.data;

  // const { customerId, amount, status } = CreateInvoice.parse(
  //   Object.fromEntries(formdata)
  // );

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];
  try {

    // throw new Error();

    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
  } catch (e) {
    return {
      message: "Database Error: Failed to Create Invoice.",
    };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function updateInvoice(id: string,formState:State, formdata: FormData) {
  
  const validation = CreateInvoice.safeParse(Object.fromEntries(formdata));


    if (!validation.success) {
    // console.log(validation.error?.flatten().fieldErrors);

    const newFormState = { ...formState };

    newFormState.errors = validation.error?.flatten().fieldErrors;
    newFormState.message = "invoice updating failed";

    // console.log(formState)

    return newFormState;
  }

  const { customerId, amount, status } = validation.data;
  
  
  
  // const { customerId, amount, status } = UpdateInvoice.parse(
  //   Object.fromEntries(formdata)
  // );

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  try {
    await sql`
    update invoices set 
     amount = ${amountInCents}, 
     status = ${status}, 
     date = ${date}    
     where id = ${id}
  `;
  } catch (error) {
     return {
      message: "Database Error: Failed to Update Invoice.",
    };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  throw new Error(":O");

  await sql`  
    delete from invoices where id = ${id}
  
  `;

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}
