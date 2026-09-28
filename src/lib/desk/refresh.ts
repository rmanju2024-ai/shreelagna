import { revalidatePath, updateTag } from "next/cache";

export function refreshDesk(paths: string[] = ["/desk"]) {
  updateTag("desk");
  for (const path of paths) revalidatePath(path);
}
