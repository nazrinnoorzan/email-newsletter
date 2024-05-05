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
  const archiveLinkRegex = /^https:\/\/diri\.my\/courses.+/gm;
  const unsubscribeRegex = /Copyright(\n|.)*?\(\*\|UNSUB\|\*\)/g;
  let plainText = "";

  plainText = plainTextSource.replace(previewTextRegex, "");
  plainText = plainText.replace(archiveRegex, "");
  plainText = plainText.replace(archiveLinkRegex, "");
  plainText = plainText.replace(unsubscribeRegex, "");

  return plainText;
};
