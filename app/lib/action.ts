"use server";

import {z} from 'zod'
import {neon} from '@neondatabase/serverless';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation'

const sql = neon(process.env.POSTGRES_URL!);

const FormSchema = z.object({

    id: z.string(),
    amount:  z.coerce.number(),
    customerId: z.string(),
    status: z.enum(['pending','paid']),
    date: z.string()   

})

const CreateInvoice = FormSchema.omit({id:true,date:true})

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

 const {customerId,amount,status} = CreateInvoice.parse(Object.fromEntries(formdata))

  const amountInCents = amount*100
  const date = new Date().toISOString().split('T')[0];  
 
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices')


}
