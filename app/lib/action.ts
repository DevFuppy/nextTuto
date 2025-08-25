"use server";

import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { error } from "console";

const sql = neon(process.env.POSTGRES_URL!);

const FormSchema = z.object({
  id: z.string(),
  amount: z.coerce.number(),
  customerId: z.string(),
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formdata: FormData) {
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

  const { customerId, amount, status } = CreateInvoice.parse(
    Object.fromEntries(formdata)
  );

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];
  try {
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
  } catch(e) {

    console.log(e)

  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function updateInvoice(id: string, formdata: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse(
    Object.fromEntries(formdata)
  );

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

    console.log(error)

  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {

   

    throw new Error(":O")

    await sql`  
    delete from invoices where id = ${id}
  
  `;
       

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}
