import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = cookies();
    let currentUsername = "";
    
    const tokenCookie = cookieStore.get("token")?.value || cookieStore.get("workingsession")?.value || cookieStore.get("username")?.value;
    
    if (tokenCookie) {
      try {
        const parsed = JSON.parse(tokenCookie);
        if (parsed.username) currentUsername = parsed.username;
      } catch {
        currentUsername = tokenCookie;
      }
    }

    // ถ้าหา Session ไม่เจอ ให้ดึงบัญชีที่มี role เป็น CLIENT คนแรกในระบบมาสำรองแบบไดนามิก
    if (!currentUsername) {
      const fallbackClient = (await prisma.$queryRaw`
        SELECT username FROM users WHERE role = 'CLIENT' LIMIT 1
      `.catch(() => [])) as any[];
      
      currentUsername = fallbackClient[0]?.username || "";
    }

    // 1. ดึงข้อมูลผู้ใช้ปัจจุบันเพื่อเอา site_id และ client_id (ถ้ามี)
    const currentUserList = (await prisma.$queryRaw`
      SELECT u.id, u.username, u.name, u.role, u.site_id, s.client_id, s.site_name
      FROM users u
      LEFT JOIN sites s ON u.site_id = s.id
      WHERE u.username = ${currentUsername} 
      LIMIT 1
    `.catch(() => [])) as any[];

    const currentUser = currentUserList[0];
    const clientId = currentUser?.client_id;
    const siteName = currentUser?.site_name || "บจก. พินกุ๊ด (ไทยแลนด์)";

    // ดึงข้อมูลบริษัทลูกค้าจากตาราง clients
    let clientRecord = null;
    if (clientId) {
      clientRecord = await prisma.client.findUnique({
        where: { id: clientId },
      }).catch(() => null);
    }

    // ถ้ายังไม่เจอ ให้ดึง client รายแรกเป็นค่าสำรอง
    if (!clientRecord) {
      clientRecord = await prisma.client.findFirst().catch(() => null);
    }

    // 2. ดึงรายการใบแจ้งหนี้ (เช็คจาก clientId หรือดึงทั้งหมดถ้าไม่มีการผูก)
    let rawInvoices: any[] = [];
    if (clientId) {
      rawInvoices = await prisma.invoice.findMany({
        where: { clientId: clientId },
        orderBy: { createdAt: "desc" },
      }).catch(() => []);
    }

    if (rawInvoices.length === 0) {
      rawInvoices = await prisma.invoice.findMany({
        orderBy: { createdAt: "desc" },
      }).catch(() => []);
    }

    // แปลงรูปแบบฟิลด์ให้ตรงกับหน้าบ้าน (snake_case)
    const invoices = rawInvoices.map((inv: any) => ({
      id: inv.id,
      invoice_number: inv.invoiceNumber,
      billing_month: inv.billingMonth,
      subtotal: inv.subtotal,
      vat: inv.vat,
      total_amount: inv.totalAmount,
      due_date: inv.dueDate,
      status: inv.status,
      slip_url: inv.slipUrl,
      created_at: inv.createdAt,
    }));

    return NextResponse.json({
      success: true,
      client: clientRecord ? {
        id: clientRecord.id,
        company_name: clientRecord.companyName,
        companyName: clientRecord.companyName,
        contract_number: clientRecord.contractNumber,
        contract_url: clientRecord.contractUrl,
        monthly_fee: clientRecord.monthlyFee,
        contact_person: clientRecord.contactPerson,
        contact_phone: clientRecord.contactPhone,
      } : {
        companyName: siteName,
      },
      invoices,
    });
  } catch (error: any) {
    console.error("Billing API Error Detail:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}