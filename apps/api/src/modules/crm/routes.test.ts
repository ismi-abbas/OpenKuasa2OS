import { expect, it } from "vitest";
import { contactInput, mapContact } from "./routes";

it("normalizes and clamps contact input", () => {
  const v = contactInput.parse({ firstName: " Aisyah ", email: "A@B.CO", country: "", status: "bogus", leadScore: "250" });
  expect([v.firstName, v.email, v.country, v.status, v.leadScore]).toEqual(["Aisyah", "a@b.co", "MY", "lead", 100]);
});

it("rejects bad input", () => {
  expect(contactInput.safeParse({ firstName: "", email: "a@b.co" }).success).toBe(false);
  expect(contactInput.safeParse({ firstName: "A", email: "x" }).success).toBe(false);
  expect(contactInput.safeParse({ firstName: "A", email: "a@b.co", country: "MYS" }).success).toBe(false);
});

it("maps nulls to display defaults", () => {
  const row = { id: "1", email: null, company: null, firstName: "A", lastName: null, phone: null, country: null, status: "lead", leadScore: 3, ownerName: null, lastInteractionAt: null };
  expect(mapContact(row).company).toBe("Personal");
});
