import { describe, expect, it } from "vitest";
import { asStringList, formList, hopeDisplay, hopeValues, languagesKnown, listedHope, packHopeBag } from "./multi-values";

describe("multi values", () => {
  it("keeps unique listed choices", () => {
    expect(listedHope(["Any state", "Karnataka"], ["Karnataka", "Delhi"], "Any state")).toEqual([
      "Any state",
    ]);
    expect(listedHope(["Karnataka"], ["Karnataka", "Delhi"], "Any state")).toEqual(["Karnataka"]);
  });

  it("reads a comma list", () => {
    expect(asStringList("Tamil, Hindi")).toEqual(["Tamil", "Hindi"]);
  });

  it("reads a postgres text array", () => {
    expect(asStringList("{Tamil,Telugu}")).toEqual(["Tamil", "Telugu"]);
  });

  it("shows the Any label when a hope list is empty", () => {
    expect(hopeDisplay([], "Any religion")).toBe("Any religion");
    expect(hopeDisplay(["Hindu"], "Any religion")).toBe("Hindu");
  });

  it("prefers the joined picker field when listing form values", () => {
    const form = new FormData();
    form.set("known_languages__joined", "Tamil|English");
    expect(formList(form, "known_languages")).toEqual(["Tamil", "English"]);
  });

  it("reads languages from hobbies when the array column is empty", () => {
    expect(languagesKnown({ hobbies: "Tamil, English" })).toEqual(["Tamil", "English"]);
    expect(languagesKnown({ known_languages: ["Hindi"], hobbies: "Tamil" })).toEqual(["Hindi"]);
  });

  it("reads looking-for hopes from the text backup when arrays are empty", () => {
    const packed = packHopeBag({ pref_religions: ["Hindu"], pref_tongues: ["Tamil", "English"] });
    expect(hopeValues({ pref_community_mode: packed }, "pref_religions")).toEqual(["Hindu"]);
    expect(hopeValues({ pref_states: [], pref_state: "Tamil Nadu, Karnataka" }, "pref_states", "pref_state")).toEqual([
      "Tamil Nadu",
      "Karnataka",
    ]);
    expect(listedHope(["Shaivite"], [], "Any community")).toEqual(["Shaivite"]);
  });
});
