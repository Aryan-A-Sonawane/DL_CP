/**
 * Display labels for system roles and employment types.
 *
 * Safe to import from both client and server components (no server-only deps).
 * The underlying role *values* (EMPLOYEE, DEPT_HEAD, …) are unchanged — only
 * the human-facing wording lives here. The former "Employee" role is shown as
 * "Team Member"; whether someone is an employee or intern is a separate
 * employment type carried on the user.
 */

export function roleLabel(role: string): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "ADMIN":
      return "Org Admin";
    case "DEPT_HEAD":
      return "Department Head";
    case "EMPLOYEE":
      return "Team Member";
    default:
      return role;
  }
}

export type EmploymentType = "employee" | "intern";

export function employmentTypeLabel(t: string | null | undefined): string {
  return t === "intern" ? "Intern" : "Employee";
}
