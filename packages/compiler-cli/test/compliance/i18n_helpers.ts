/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// Describes message metadata object.
export interface Meta {
  desc?: string;
  meaning?: string;
  id?: string;
}

// Describes placeholder type used in tests. Note: the type is an array (not an object), since it's
// important to preserve the order of placeholders (so that we can compare it with generated
// output).
export type Placeholder = [string, string];

// Unique message id index that is needed to avoid different i18n vars with the same name to appear
// in the i18n block while generating an output string (used to verify compiler-generated code).
let msgIndex = 0;

// Wraps a string into quotes is needed.
// Note: if a string starts with `$` is a special case in tests when ICU reference
// is used as a placeholder value, this we should not wrap it in quotes.
const quotedValue = (value: string) => value.startsWith('$') ? value : `"${value}"`;

// Generates a string that represents expected Closure metadata output.
export function i18nMsgClosureMeta(meta?: Meta): string {
  if (!meta || !(meta.desc || meta.meaning)) return '';
  return `
    /**
     ${meta.desc ? '* @desc ' + meta.desc : ''}
     ${meta.meaning ? '* @meaning ' + meta.meaning : ''}
     */
  `;
}

// Converts a set of placeholders to a string (as it's expected from compiler).
export function i18nPlaceholdersToString(placeholders: Placeholder[]): string {
  if (placeholders.length === 0) return '';
  const result = placeholders.map(([key, value]) => `"${key}": ${quotedValue(value)}`);
  return `, { ${result.join(',')} }`;
};

// Generates a string that represents expected $localize metadata output.
export function i18nMsgLocalizeMeta(meta?: Meta): string {
  if (!meta) return '';
  let localizeMeta = '';
  if (meta.meaning) localizeMeta += `${meta.meaning}|`;
  if (meta.desc) localizeMeta += meta.desc;
  if (meta.id) localizeMeta += `@@${meta.id}`;
  return `:${localizeMeta}:`;
};

// Transforms a message in a Closure format to a $localize version.
export function i18nMsgInsertLocalizePlaceholders(
    message: string, placeholders: Placeholder[]): string {
  if (placeholders.length > 0) {
    message = message.replace(/{\$(.*?)}/g, function(_, name) {
      const value = placeholders.find(([k, _]) => k === name)![1];
      // e.g. startDivTag -> START_DIV_TAG
      const key = name.replace(/[A-Z]/g, (ch: string) => '_' + ch).toUpperCase();
      return '$' + String.raw`{${quotedValue(value)}}:${key}:`;
    });
  }
  return message;
};

// Generates a string that represents expected i18n block content for simple message.
export function i18nMsg(message: string, placeholders: Placeholder[] = [], meta?: Meta) {
  const varName = `$I18N_${msgIndex++}$`;
  const closurePlaceholders = i18nPlaceholdersToString(placeholders);
  const locMessageWithPlaceholders = i18nMsgInsertLocalizePlaceholders(message, placeholders);
  return String.raw`
    var ${varName};
    if (typeof ngI18nClosureMode !== "undefined" && ngI18nClosureMode) {
        ${i18nMsgClosureMeta(meta)}
        const $MSG_EXTERNAL_${msgIndex}$ = goog.getMsg("${message}"${closurePlaceholders});
        ${varName} = $MSG_EXTERNAL_${msgIndex}$;
    }
    else {
      ${varName} = $localize \`${i18nMsgLocalizeMeta(meta)}${locMessageWithPlaceholders}\`;
    }`;
};

// Generates a string that represents expected i18n block content for a message that requires
// post-processing (thus includes `ɵɵi18nPostprocess` in generated code).
export function i18nMsgWithPostprocess(
    message: string, placeholders: Placeholder[] = [], meta?: Meta,
    postprocessPlaceholders?: Placeholder[]) {
  const varName = `$I18N_${msgIndex}$`;
  const ppPaceholders =
      postprocessPlaceholders ? i18nPlaceholdersToString(postprocessPlaceholders) : '';
  return String.raw`
        ${i18nMsg(message, placeholders, meta)}
        ${varName} = $r3$.ɵɵi18nPostprocess($${varName}$${ppPaceholders});
      `;
};

// Generates a string that represents expected i18n block content for an ICU.
export function i18nIcuMsg(message: string, placeholders: Placeholder[] = []) {
  return i18nMsgWithPostprocess(message, [], undefined, placeholders);
};
