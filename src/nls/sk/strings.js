/*
 * GNU AGPL-3.0 License
 *
 * Copyright (c) 2021 - present core.ai . All rights reserved.
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
  "SYSTEM_DEFAULT": "Predvolený v systéme",
  "PROJECT_BUSY": "Operácie projektu prebiehajú",
  "DUPLICATING": "Duplikuje sa {0}",
  "MOVING": "Presúva sa {0}",
  "COPYING": "Kopíruje sa {0}",
  "DELETING": "Odstraňuje sa {0}",
  "RENAMING": "Premenovanie",
  "GENERIC_ERROR": "(chyba {0})",
  "NOT_FOUND_ERR": "Súbor nenájdený.",
  "NOT_READABLE_ERR": "Súbor sa nedá čítať.",
  "EXCEEDS_MAX_FILE_SIZE": "Súbory väčšie ako {0} MB nie je možné otvoriť v aplikácii {APP_NAME}.",
  "NO_MODIFICATION_ALLOWED_ERR": "Cieľový adresár nemôže byť zmenený.",
  "NO_MODIFICATION_ALLOWED_ERR_FILE": "Práva vám neumožňujú robiť zmeny.",
  "CONTENTS_MODIFIED_ERR": "Súbor bol upravený mimo aplikácie {APP_NAME}.",
  "UNSUPPORTED_ENCODING_ERR": "Neznámy formát kódovania",
  "ENCODE_FILE_FAILED_ERR": "Aplikácii {APP_NAME} sa nepodarilo zakódovať obsah súboru.",
  "DECODE_FILE_FAILED_ERR": "Aplikácii {APP_NAME} sa nepodarilo dekódovať obsah súboru.",
  "UNSUPPORTED_UTF16_ENCODING_ERR": "Aplikácia {APP_NAME} momentálne nepodporuje textové súbory s kódovaním UTF-16.",
  "FILE_EXISTS_ERR": "Súbor alebo adresár už existuje.",
  "FILE": "súbor",
  "FILE_TITLE": "Súbor",
  "DIRECTORY": "adresár",
  "DIRECTORY_TITLE": "Adresár",
  "DIRECTORY_NAMES_LEDE": "Názvy adresárov",
  "FILENAMES_LEDE": "Názvy súborov",
  "FILENAME": "Názov súboru",
  "DIRECTORY_NAME": "Názov adresára",
  "ERROR_LOADING_PROJECT": "Chyba pri otváraní projektu",
  "OPEN_DIALOG_ERROR": "Nastala chyba pri zobrazení dialógu otvorenia súboru. (chyba {0})",
  "REQUEST_NATIVE_FILE_SYSTEM_ERROR": "Nastala chyba pri načítaní adresára <span class='dialog-filename'>{0}</span>. (chyba {1})",
  "READ_DIRECTORY_ENTRIES_ERROR": "Nastala chyba pri načítaní obsahu adresára <span class='dialog-filename'>{0}</span>. (chyba {1})",
  "ERROR_OPENING_FILE_TITLE": "Chyba pri otváraní súboru",
  "ERROR_OPENING_FILE": "Nastala chyba pri otváraní súboru <span class='dialog-filename'>{0}</span>. {1}",
  "ERROR_OPENING_FILES": "Nastala chyba pri otváraní nasledujúcich súborov:",
  "ERROR_RELOADING_FILE_TITLE": "Chyba pri načítaní zmien z disku",
  "ERROR_RELOADING_FILE": "Nastala chyba pri načítaní súboru <span class='dialog-filename'>{0}</span>. {1}",
  "ERROR_SAVING_FILE_TITLE": "Chyba pri ukladaní súboru",
  "ERROR_SAVING_FILE": "Nastala chyba pri ukladaní súboru <span class='dialog-filename'>{0}</span>. {1}",
  "ERROR_RENAMING_FILE_TITLE": "Chyba pri premenovaní súboru",
  "ERROR_RENAMING_FILE": "Nastala chyba pri premenovaní súboru <span class='dialog-filename'>{0}</span>. {1}",
  "ERROR_RENAMING_NOT_IN_PROJECT": "Súbor alebo adresár nie je súčasťou aktuálne otvoreného projektu. Bohužiaľ, v tomto bode je možné premenovať iba súbory projektu.",
  "ERROR_MOVING_FILE_TITLE": "Chyba pri presúvaní {0}",
  "ERROR_MOVING_FILE": "Pri pokuse o presun položky {2} <span class='dialog-filename'>{0}</span> sa vyskytla chyba. {1}",
  "ERROR_MOVING_NOT_IN_PROJECT": "Nie je možné presunúť súbor/priečinok, pretože nie sú súčasťou aktuálneho projektu.",
  "ERROR_DELETING_FILE_TITLE": "Chyba pri zmazaní súboru",
  "ERROR_DELETING_FILE": "Nastala chyba pri zmazaní súboru <span class='dialog-filename'>{0}</span>. {1}",
  "INVALID_FILENAME_TITLE": "Neplatný {0} názov",
  "CANNOT_PASTE_TITLE": "Nie je možné prilepiť {0}",
  "CANNOT_DOWNLOAD_TITLE": "Nedá sa stiahnuť {0}",
  "ERR_TYPE_DOWNLOAD_FAILED": "Pri preberaní súboru <span class='dialog-filename'>{0}</span> sa vyskytla chyba",
  "ERR_TYPE_PASTE_FAILED": "Pri vkladaní <span class='dialog-filename'>{0}</span> do <span class='dialog-filename'>{1}</span> sa vyskytla chyba",
  "CANNOT_DUPLICATE_TITLE": "Nie je možné duplikovať",
  "ERR_TYPE_DUPLICATE_FAILED": "Pri duplikovaní <span class='dialog-filename'>{0}</span> sa vyskytla chyba",
  "INVALID_FILENAME_MESSAGE": "Názvy súboru nesmú obsahovať nasledujúce znaky: {0} alebo používať rezervované systémové slová.",
  "ENTRY_WITH_SAME_NAME_EXISTS": "Súbor alebo adresár s názvom <span class='dialog-filename'>{0}</span> už existuje.",
  "ERROR_CREATING_FILE_TITLE": "Chyba pri vytváraní súboru {0}",
  "ERROR_CREATING_FILE": "Nastala chyba pri vytváraní súboru {0} <span class='dialog-filename'>{1}</span>. {2}",
  "ERROR_MIXED_DRAGDROP": "Nie je možné otvoriť priečinok súčasne s otváraním iných súborov.",
  "ERROR_KEYMAP_TITLE": "Chyba pri čítaní mapy používateľských kľúčov",
  "ERROR_KEYMAP_CORRUPT": "Váš súbor mapy kľúčov nie je platný JSON. Súbor sa otvorí, aby ste mohli opraviť formát.",
  "ERROR_LOADING_KEYMAP": "Váš súbor mapy kľúčov nie je platný textový súbor s kódovaním UTF-8 a nemožno ho načítať",
  "ERROR_RESTRICTED_COMMANDS": "Nemôžete zmeniť priradenie skratiek k týmto príkazom: {0}",
  "ERROR_RESTRICTED_SHORTCUTS": "Nemôžete zmeniť priradenie týchto skratiek: {0}",
  "ERROR_MULTIPLE_SHORTCUTS": "Znova priraďujete viacero skratiek k týmto príkazom: {0}",
  "ERROR_DUPLICATE_SHORTCUTS": "Máte viacero väzieb týchto skratiek: {0}",
  "ERROR_INVALID_SHORTCUTS": "Tieto skratky sú neplatné: {0}",
  "ERROR_NONEXISTENT_COMMANDS": "Priraďujete skratky k neexistujúcim príkazom: {0}",
  "ERROR_PREFS_CORRUPT_TITLE": "Chyba čítania predvolieb",
  "ERROR_PREFS_CORRUPT": "Váš súbor predvolieb nie je platný JSON. Súbor sa otvorí, aby ste mohli opraviť formát. Zmeny sa prejavia až po reštartovaní aplikácie {APP_NAME}.",
  "ERROR_PROJ_PREFS_CORRUPT": "Váš súbo