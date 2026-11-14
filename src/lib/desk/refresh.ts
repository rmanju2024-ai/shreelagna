import { revalidatePath, updateTag } from "next/cache";

export function refreshDesk(paths: string[] = ["/desk/tickets"]) {
  updateTag("desk");
  for (const path of paths) revalidatePath(path);
}
