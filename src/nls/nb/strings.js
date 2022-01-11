/*
 * GNU AGPL-3.0 License
 *
 * Copyright (c) 2021 - present core.ai . All rights reserved.
 * Original work Copyright (c) 2012 - 2021 Adobe Systems Incorporated. All rights reserved.
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License
 * for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://opensource.org/licenses/AGPL-3.0.
 *
 */

define({

    /**
     * Errors
     */

    // General file io error strings
    "GENERIC_ERROR": "(feil {0})",
    "NOT_FOUND_ERR": "Kunne ikke finne filen.",
    "NOT_READABLE_ERR": "Filen kunne ikke bli lest.",
    "NO_MODIFICATION_ALLOWED_ERR": "Målkatalogen kunnet ikke bli modifisert.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE": "Rettighetene tillater ikke modifikasjoner.",
    "CONTENTS_MODIFIED_ERR": "Filen har blitt modifisert utenfor  {APP_NAME}.",
    "UNSUPPORTED_ENCODING_ERR": "Filen er ikke UTF-8 kodet tekst.",
    "FILE_EXISTS_ERR": "Filen eller katalogen eksisterer allerede.",
    "FILE": "fil",
    "DIRECTORY": "katalog",
    "DIRECTORY_NAMES_LEDE": "Katalognavn",
    "FILENAMES_LEDE": "Filnavn",
    "FILENAME": "filnavn",
    "DIRECTORY_NAME": "katalognavn",


    // Project error strings
    "ERROR_LOADING_PROJECT": "Feil ved lasting av prosjektet",
    "OPEN_DIALOG_ERROR": "Det oppstod en feil ved forsøk på å åpne fildialog. (feil {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR": "Det oppstod en feil ved forsøk på å laste katalogen <span class='dialog-filename'>{0}</span>. (feil {1})",
    "READ_DIRECTORY_ENTRIES_ERROR": "Det oppstod en feil ved lesing av innholdet i katalogen <span class='dialog-filename'>{0}</span>. (feil {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE": "Feil ved åpning av filen",
    "ERROR_OPENING_FILE": "Det oppstod en feil ved forsøk på å åpne filen <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES": "Det oppstod en feil ved forsøk på å åpne følgende filer:",
    "ERROR_RELOADING_FILE_TITLE": "Feil ved oppfriskning av endringer fra disk",
    "ERROR_RELOADING_FILE": "Det oppstod en feil ved forsøk på å oppfriske filen <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE": "Feil ved lagring av fil",
    "ERROR_SAVING_FILE": "Det oppstod en feil ved forsøk på å lagre filen <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE": "Det oppstod en feil ved forsøk på å gi nytt navn til filen",
    "ERROR_RENAMING_FILE": "Det oppstod en feil ved forsøk på å gi nytt navn til filen <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE": "Det oppstod en feil ved forsøk på å slette filen",
    "ERROR_DELETING_FILE": "Det oppstod en feil ved forsøk på å slette filen <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE": "Ugyldig filnavn {0}",
    "INVALID_FILENAME_MESSAGE": "Filnavn kan ikke inneholde følgende tegn: {0}",
    "ENTRY_WITH_SAME_NAME_EXISTS": "En fil eller katalog med navnet <span class='dialog-filename'>{0}</span> eksisterer allerede.",
    "ERROR_CREATING_FILE_TITLE": "Feil ved oppretting av fil {0}",
    "ERROR_CREATING_FILE": "Det oppstod en feil ved forsøk på å opprette filen  {0} <span class='dialog-filename'>{1}</span>. {2}",

    // Application preferences corrupt error strings
    "ERROR_PREFS_CORRUPT_TITLE": "Feil ved lesing av preferanser",
    "ERROR_PREFS_CORRUPT": "Din preferansefil er ikke gyldig JSON. Filen vil bli åpnet slik at du kan korrigere formatet. Du trenger å starte {APP_NAME} på nytt for at endringene skal ha effekt.",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE": "Oops! {APP_NAME} kjører ikke i nettlesere ennå.",
    "ERROR_IN_BROWSER": "{APP_NAME} er bygd med HTML, men akkurat nå kjører den som en skrivebords-app slik at du kan bruke den til å redigere lokale filer. Vennligst bruk applikasjonsskallet <b>github.com/adobe/brackets-app</b> repo'et for å kjøre {APP_NAME}",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE": "Feil ved indeksering av filer",
    "ERROR_MAX_FILES": "Maksimalt antall filer har blitt indeksert. Handlinger som slår opp filer i indeksen kan feile.",

    // Live Preview error strings
    "ERROR_LAUNCHING_BROWSER_TITLE": "Feil ved åpning av nettleser",
    "ERROR_CANT_FIND_CHROME": "Nettleseren Google Chrome ble ikke funnet. Vennligst sørg for at den er installert.",
    "ERROR_LAUNCHING_BROWSER": "En feil skjedde ved åpning av nettleseren. (feil {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE": "Live Preview feil",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE": "Kobler til nettleser",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE": "En Live Preview kobling til Chrome kunne ikke bli etablert. For at Live Preview skal fungere må Chrome startes med remote debugging på.<br /><br />Ønsker du å start Chrome på nytt med remote debugging slått på?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE": "Kan ikke laste Live Preview siden",
    "LIVE_DEV_NEED_HTML_MESSAGE": "Åpne en HTML-fil for å åpne live Preview.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE": "For å starte Live Preview med en server-side fil må du spesifisere en base-url for dette prosjektet.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE": "Feil ved starting av HTTP serveren for Live Preview filer. Vennligst prøv igjen.",
    "LIVE_DEVELOPMENT_INFO_TITLE": "Velkommen til Live Preview!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE": "Live Preview kobler {APP_NAME} til din nettleser. Den åpner en forhåndsvisning av HTML-filen i nettleseren. Forhåndsvisningen oppdateres umiddelbart når du redigerer koden.<br /><br />I denne tidlige versjonen av {APP_NAME} fungerer Live Preview bare for endringer av <strong>CSS-filer</strong> og bare med <strong>Google Chrome</strong>. Vi ønsker å implementere det for HTML og JavaScript også snart!<br /><br /> (Du ser bare denne meldingen en gang).",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING": "For mer informasjon, se <a href='{0}' title='{0}'>Troubleshooting Live Preview connection errors</a>.",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED": "Live Preview",
    "LIVE_DEV_STATUS_TIP_PROGRESS1": "Live Preview: Kobler til\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2": "Live Preview: Initaliserer\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED": "Koble fra Live Preview",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC": "Live Preview (lagre fil for oppfriskning)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR": "Live Preview (kan ikke oppdatere p.g.a. syntax error)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS": "Live Preview ble kansellert fordi nettleserens utviklerverktøy ble åpnet",
    "LIVE_DEV_DETACHED_TARGET_CLOSED": "Live Preview ble kansellert fordi siden ble stengt i nettleseren",
    "LIVE_DEV_NAVIGATED_AWAY": "Live Preview ble kansellert fordi nettleseren navigerte til en side som ikke er en del av prosjektet",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON": "Live Preview ble kansellert for en ukjent årsak ({0})",

    "SAVE_CLOSE_TITLE": "Lagre endringer",
    "SAVE_CLOSE_MESSAGE": "Ønsker du å lagre enderinger i dokumentet <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE": "Ønsker du å lagre enderinger i følgende filer?",
    "EXT_MODIFIED_TITLE": "Eksterne endringer",
    "CONFIRM_DELETE_TITLE": "Bekreft sletting",
    "CONFIRM_FOLDER_DELETE": "Er du sikker på at du vil slette katalogen <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE": "Fil slettet",
    "EXT_MODIFIED_WARNING": "<span class='dialog-filename'>{0}</span> har blitt modifisert på disk.<br /><br />Vil du lagre filen og overskrive de endringene?",
    "EXT_MODIFIED_MESSAGE": "<span class='dialog-filename'>{0}</span> er blitt endret på disk, men har samtidig ulagrede endringer i {APP_NAME}.<br /><br />Hvilken versjon ønsker du å beholde?",
    "EXT_DELETED_MESSAGE": "<span class='dialog-filename'>{0}</span> er blitt slettet på disken, men har ulagrede endringer i {APP_NAME}.<br /><br />Ønsker du å beholde endringene?",

    // Generic dialog/button labels
    "OK": "Ok",
    "CANCEL": "Avbryt",
    "DONT_SAVE": "Ikke lagre",
    "SAVE": "Lagre",
    "SAVE_AS": "Lagre som\u2026",
    "SAVE_AND_OVERWRITE": "Overskriv",
    "DELETE": "Slett",
    "BUTTON_YES": "Ja",
    "BUTTON_NO": "Nei",

    // Find, Replace, Find in Files
    "FIND_NO_RESULTS": "Ingen resultater",
    "FIND_QUERY_PLACEHOLDER": "Finn\u2026",
    "REPLACE_PLACEHOLDER": "Erstatt med\u2026",
    "BUTTON_REPLACE_ALL": "Alle\u2026",
    "BUTTON_REPLACE": "Erstatt",
    "BUTTON_NEXT": "\u25B6",
    "BUTTON_PREV": "\u25C0",
    "BUTTON_NEXT_HINT": "Neste treff",
    "BUTTON_PREV_HINT": "Forrige treff",
    "BUTTON_CASESENSITIVE_HINT": "Skill mellom store og små (bokstaver)",
    "BUTTON_REGEXP_HINT": "Regulært uttrykk",

    "OPEN_FILE": "Åpne fil",
    "SAVE_FILE_AS": "Lagre fil",
    "CHOOSE_FOLDER": "Velg katalog",

    "RELEASE_NOTES": "Versjonsmerknader",
    "NO_UPDATE_TITLE": "Du er oppdatert!",
    "NO_UPDATE_MESSAGE": "Du kjører den nyeste versjonen av {APP_NAME}.",

    // Find in Files
    "FIND_IN_FILES_SCOPED": "i <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE": "i prosjekt",
    "FIND_IN_FILES_ZERO_FILES": "Filter ekskluderer alle filer {0}",
    "FIND_IN_FILES_FILE": "fil",
    "FIND_IN_FILES_FILES": "filer",
    "FIND_IN_FILES_MATCH": "treff",
    "FIND_IN_FILES_MATCHES": "treff",
    "FIND_IN_FILES_MORE_THAN": "Over ",
    "FIND_IN_FILES_PAGING": "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH": "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>", // We should use normal dashes on Windows instead of em dash eventually
    "FIND_IN_FILES_EXPAND_COLLAPSE": "Ctrl/Cmd klikk for å ekspandere/kollapse alle",
    "ERROR_FETCHING_UPDATE_INFO_TITLE": "Feil ved henting av oppdateringinfo",
    "ERROR_FETCHING_UPDATE_INFO_MSG": "Det var et problem å hente siste oppdateringsinformasjon fra serveren. Vennligst kontroller at du er tilkoblet internett og prøv på nytt.",

    // File exclusion filters
    "NO_FILE_FILTER": "Ekskluder filer\u2026",
    "EDIT_FILE_FILTER": "Rediger\u2026",
    "FILE_FILTER_DIALOG": "Rediger filter",
    "FILE_FILTER_INSTRUCTIONS": "Ekskluder filer og kataloger som er lik følgende strenger / understrenger eller <a href='{0}' title='{0}'>jokertegn</a>. Skriv inn hver streng på egen linje.",
    "FILE_FILTER_CLIPPED_SUFFIX": "og {0} mere",
    "FILTER_COUNTING_FILES": "Teller filer\u2026",
    "FILTER_FILE_COUNT": "Tillater {0} av {1} filer {2}",
    "FILTER_FILE_COUNT_ALL": "Tillater alle {0} filer {1}",

    // Quick Edit
    "ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND": "Ingen Quick Edit tilgjengelig for denne markørposisjonen.",
    "ERROR_CSSQUICKEDIT_BETWEENCLASSES": "CSS Quick Edit: plassér markøren på et enkelt klassenavn",
    "ERROR_CSSQUICKEDIT_CLASSNOTFOUND": "CSS Quick Edit: ufullstendig klasse attributt",
    "ERROR_CSSQUICKEDIT_IDNOTFOUND": "CSS Quick Edit: ufullstendig id attributt",
    "ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR": "CSS Quick Edit: plassér markøren i tag, class eller id",
    "ERROR_TIMINGQUICKEDIT_INVALIDSYNTAX": "CSS Timing Function Quick Edit: ugyldig syntax",
    "ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND": "JS Quick Edit: plassér markøren i funksjonsnavnet",

    // Quick Docs
    "ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND": "Ingen Quick Docs tilgjengelig for denne markørposisjonen",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING": "Laster\u2026",
    "UNTITLED": "Uten tittel",
    "WORKING_FILES": "Arbeidsfiler",

    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL": "Ctrl",
    "KEYBOARD_SHIFT": "Sh