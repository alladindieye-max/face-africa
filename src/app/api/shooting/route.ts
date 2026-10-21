import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
const schema=z.object({fullName:z.string().trim().min(2).max(120),email:z.email(),phone:z.string().trim().min(7).max(30),city:z.string().trim().min(2).max(100),shootingType:z.enum(['book','portrait','mode','beaute','lifestyle','commercial','evenementiel','autre']),period:z.string().trim().min(2).max(120),budgetXof:z.number().int().nonnegative().max(100000000).optional(),description:z.string().trim().min(10).max(4000),consent:z.literal(true),preferredMode:z.enum(['team_finds','client_chooses']),photographerId:z.uuid().optional()});
export async function POST(request:Request){let body:unknown;try{body=await request.json()}catch{return NextResponse.json({error:'Corps de requête JSON invalide.'},{status:400})}const parsed=schema.safeParse(body);if(!parsed.success)return NextResponse.json({error:'Vérifiez les champs du formulaire.',details:parsed.error.issues.map(i=>({field:i.path.join('.'),message:i.message}))},{status:422});
 // The service-role key is used only in this server route; it must never be exposed to the browser.
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL; const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!serviceKey)return NextResponse.json({error:'Le formulaire n’est pas encore activé : la base de données doit être configurée. Aucune demande n’a été enregistrée.'},{status:503});
 const supabase=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await supabase.from('shooting_requests').insert({full_name:parsed.data.fullName,email:parsed.data.email,phone:parsed.data.phone,city:parsed.data.city,shooting_type:parsed.data.shootingType,desired_period:parsed.data.period,budget_xof:parsed.data.budgetXof??null,description:parsed.data.description,preferred_mode:parsed.data.preferredMode,preferred_photographer_id:parsed.data.photographerId??null,consent_at:new Date().toISOString()}).select('reference_code').single();
 if(error){console.error('shooting_request_insert_failed',error.code);return NextResponse.json({error:'La demande n’a pas pu être enregistrée. Aucune confirmation ne peut être donnée pour le moment.'},{status:503});}
 return NextResponse.json({message:'Votre demande a bien été enregistrée. L’équipe FACEAFRICA doit encore étudier les disponibilités et confirmer les conditions.',reference:data.reference_code},{status:201});
}
