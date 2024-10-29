export enum CAMPAIGN_STATUS {
  SENT = "sent",
  DRAFT = "draft",
  SCHEDULED = "scheduled",
}

export const emailIsValid = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const replaceEmailHtmlSource = (
  htmlSource: string,
  subjectReplace: string,
) => {
  const subjectRegex = /(\*\|MC:SUBJECT\|\*)/g;
  const previewTextRegex =
    /<!--\*\|IF:MC_PREVIEW_TEXT\|\*-->(\s+(.*?)\s*<!--\*\|END:IF\|\*-->)/g;
  const archiveRegex = /<div data-block-id="1"(\s+(.*?)\s*<\/div>)/g;
  const unsubscribeRegex = /<div data-block-id="9"(\s+(.*?)\s*<\/div>)/g;
  let updatedHtml = "";

  updatedHtml = htmlSource.replace(subjectRegex, subjectReplace);
  updatedHtml = updatedHtml.replace(previewTextRegex, "");
  updatedHtml = updatedHtml.replace(archiveRegex, "");
  updatedHtml = updatedHtml.replace(unsubscribeRegex, "");

  return updatedHtml;
};

export const replacePlainTextSource = (plainTextSource: string) => {
  const previewTextRegex = /(\*\|MC_PREVIEW_TEXT\|\*)/g;
  const archiveRegex = /View this email in your browser \(\*\|ARCHIVE\|\*\)/g;
  const unsubscribeRegex = /Copyright(\n|.)*?\(\*\|UNSUB\|\*\)/g;
  let plainText = "";

  plainText = plainTextSource.replace(previewTextRegex, "");
  plainText = plainText.replace(archiveRegex, "");
  plainText = plainText.replace(unsubscribeRegex, "");

  return plainText;
};

export const replaceEmailSubject = (
  subject: string,
  firstName: string | null,
) => {
  const subjectRegex = /(\*\|FNAME\|\*)/g;
  let updatedSubject = "";
  let processFirstName = firstName;

  if (processFirstName === null || processFirstName === "-")
    processFirstName = "";

  updatedSubject = subject.replace(subjectRegex, processFirstName);

  return updatedSubject;
};

export const convertToISOWithoutSeconds = (dateString: Date | null) => {
  if (!dateString) return "";

  // Create a new Date object from the input string
  const date = new Date(dateString);

  // Extract the year, month, day, hours, and minutes
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  // Construct the ISO string without seconds
  return `${year}-${month}-${day}T${hours}:${minutes}:00`;
};

export const sanitizeStringWithUniqueId = (input: string) => {
  // Sanitize the input string
  let sanitized = input
    .replace(/[^a-zA-Z0-9\-\._\s]/g, "") // Remove all disallowed characters
    .replace(/\s+/g, "_"); // Replace spaces with underscores

  // Get the current timestamp
  const timestamp = Date.now().toString();

  // Ensure the total length is less than or equal to 64 characters
  // Leave space for the timestamp (length of timestamp + 1 for underscore)
  const maxSanitizedLength = 64 - timestamp.length - 1; // -1 for the underscore
  if (sanitized.length > maxSanitizedLength) {
    sanitized = sanitized.substring(0, maxSanitizedLength);
  }

  // Return the sanitized string with the timestamp suffix
  return `${sanitized}_${timestamp}`;
};
