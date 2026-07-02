import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Webhook de Clerk: materializa el usuario en Supabase.
 * user.created → upsert en perfiles + fila inicial en rachas.
 * Idempotente: los retries de Clerk no duplican ni fallan.
 */
export async function POST(req: NextRequest) {
  let evt;
  try {
    // Verifica la firma svix con CLERK_WEBHOOK_SIGNING_SECRET
    evt = await verifyWebhook(req);
  } catch {
    return NextResponse.json(
      { data: null, error: "Firma de webhook inválida" },
      { status: 400 }
    );
  }

  if (evt.type !== "user.created") {
    return NextResponse.json({ data: { ignored: evt.type }, error: null });
  }

  const { id, first_name, last_name, email_addresses, primary_email_address_id, image_url } =
    evt.data;

  const email =
    email_addresses?.find((e) => e.id === primary_email_address_id)?.email_address ??
    email_addresses?.[0]?.email_address ??
    null;
  const nombre = [first_name, last_name].filter(Boolean).join(" ") || null;

  const supabase = supabaseAdmin();

  const { data: perfil, error: perfilError } = await supabase
    .from("perfiles")
    .upsert(
      { clerk_id: id, nombre, email, avatar_url: image_url ?? null },
      { onConflict: "clerk_id" }
    )
    .select("id")
    .single();

  if (perfilError || !perfil) {
    // 500 → Clerk reintenta
    return NextResponse.json(
      { data: null, error: `Error creando perfil: ${perfilError?.message}` },
      { status: 500 }
    );
  }

  const { error: rachaError } = await supabase
    .from("rachas")
    .upsert(
      { perfil_id: perfil.id },
      { onConflict: "perfil_id", ignoreDuplicates: true }
    );

  if (rachaError) {
    return NextResponse.json(
      { data: null, error: `Error creando racha: ${rachaError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: { perfilId: perfil.id }, error: null });
}
