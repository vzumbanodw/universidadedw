import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Protege os dois realms da plataforma:
 *
 * - `/admin/*` (operador Dataweb): exige o cookie de sessão do operador.
 * - `/dashboard/*` (aluno): exige uma sessão válida do Supabase Auth. As contas
 *   são criadas no backoffice; quem não tem sessão vai para `/login`.
 *
 * Se o Supabase não estiver configurado, o gate do aluno é ignorado para o
 * protótipo continuar utilizável em desenvolvimento.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Operador -------------------------------------------------------------
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const session = request.cookies.get("admin_session")?.value;
    if (session !== "ok") return redirectTo(request, "/admin/login");
  }

  // --- Aluno ----------------------------------------------------------------
  if (pathname.startsWith("/dashboard")) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return NextResponse.next();

    // Resposta que carregará os cookies de sessão renovados.
    const response = NextResponse.next({ request });
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return redirectTo(request, "/login");
    return response;
  }

  return NextResponse.next();
}

function redirectTo(request: NextRequest, path: string) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
