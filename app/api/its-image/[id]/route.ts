import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || !/^\d{8}$/.test(id)) {
    return new NextResponse("Invalid ITS number", { status: 400 });
  }

  try {
    const itsUrl = `https://www.its52.com/GetImage.aspx?ID=${id}`;

    const response = await fetch(itsUrl, {
      headers: {
        Referer: "https://www.its52.com/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return new NextResponse("Failed to fetch image", {
        status: response.status,
      });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error("Error fetching ITS image:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
