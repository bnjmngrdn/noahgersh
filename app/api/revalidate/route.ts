import { revalidatePath, revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { message: "SANITY_REVALIDATE_SECRET is not configured" },
      { status: 501 },
    );
  }

  const urlSecret = request.nextUrl.searchParams.get("secret");
  if (urlSecret !== secret) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  try {
    revalidateTag("sanity", "max");
    for (const path of ["/", "/about", "/projects", "/library"]) {
      revalidatePath(path);
    }
    return NextResponse.json({ revalidated: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
