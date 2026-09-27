export type DeskPulse = {
  members: number;
  profiles: number;
  vadhu: number;
  vara: number;
  active: number;
  hidden: number;
  ticketsNew: number;
  ticketsBusy: number;
  ticketsHold: number;
  ticketsDone: number;
  interestsPending: number;
  interestsAccepted: number;
  viewsWeek: number;
};

export const EMPTY_DESK_PULSE: DeskPulse = {
  members: 0,
  profiles: 0,
  vadhu: 0,
  vara: 0,
  active: 0,
  hidden: 0,
  ticketsNew: 0,
  ticketsBusy: 0,
  ticketsHold: 0,
  ticketsDone: 0,
  interestsPending: 0,
  interestsAccepted: 0,
  viewsWeek: 0,
};

export function tallyProfiles(
  rows: { profile_type?: string | null; status?: string | null }[],
): Pick<DeskPulse, "profiles" | "vadhu" | "vara" | "active" | "hidden"> {
  return {
    profiles: rows.length,
    vadhu: rows.filter((row) => row.profile_type === "vadhu").length,
    vara: rows.filter((row) => row.profile_type === "vara").length,
    active: rows.filter((row) => row.status === "active").length,
    hidden: rows.filter((row) => row.status === "hidden" || row.status === "on_hold").length,
  };
}

export function tallyTickets(
  rows: { status?: string | null }[],
): Pick<DeskPulse, "ticketsNew" | "ticketsBusy" | "ticketsHold" | "ticketsDone"> {
  return {
    ticketsNew: rows.filter((row) => row.status === "new").length,
    ticketsBusy: rows.filter((row) => row.status === "in_progress").length,
    ticketsHold: rows.filter((row) => row.status === "on_hold").length,
    ticketsDone: rows.filter((row) => row.status === "done").length,
  };
}
