(() => {
  "use strict";

  const storageKey = "mathbhoot.antagonistContribution.draft.v1";
  const allowedFields = Object.freeze([
    "username",
    "email",
    "mission",
    "ideaDescription",
  ]);

  const cleanDraft = (input) => {
    const draft = {};
    allowedFields.forEach((field) => {
      draft[field] =
        typeof input?.[field] === "string" ? input[field].trim() : "";
    });
    draft.originalityConfirmed = Boolean(input?.originalityConfirmed);
    draft.updatedAt = new Date().toISOString();
    return draft;
  };

  const saveDraft = (input) => {
    const draft = cleanDraft(input);
    sessionStorage.setItem(storageKey, JSON.stringify(draft));
    return draft;
  };

  const loadDraft = () => {
    const stored = JSON.parse(sessionStorage.getItem(storageKey) || "null");
    return stored && typeof stored === "object" ? cleanDraft(stored) : null;
  };

  const clearDraft = () => sessionStorage.removeItem(storageKey);

  window.MathbhootContributionStore = Object.freeze({
    mode: "local-draft",
    fields: allowedFields,
    saveDraft,
    loadDraft,
    clearDraft,
  });
})();
