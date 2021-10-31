/*
 * GNU AGPL-3.0 License
 *
 * Copyright (c) 2021 - present core.ai . All rights reserved.
 * Original work Copyright (c) 2014 - 2021 Adobe Systems Incorporated. All rights reserved.
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
    "GENERIC_ERROR": "(erro {0})",
    "NOT_FOUND_ERR": "Non se puido atopar o arquivo.",
    "NOT_READABLE_ERR": "Non se puido ler o arquivo.",
    "NO_MODIFICATION_ALLOWED_ERR": "O directorio de destino non se pode modificar.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE": "Os permisos non permiten facer modificacións.",
    "CONTENTS_MODIFIED_ERR": "O arquivo foi modificado fóra de {APP_NAME}.",
    "UNSUPPORTED_ENCODING_ERR": "{APP_NAME} actualmente só soporta arquivos codificados como UTF-8.",
    "FILE_EXISTS_ERR": "O arquivo xa existe.",
    "FILE": "arquivo",
    "FILE_TITLE": "Arquivo",
    "DIRECTORY": "directorio",
    "DIRECTORY_TITLE": "Directorio",
    "DIRECTORY_NAMES_LEDE": "nomes de directorios",
    "FILENAMES_LEDE": "nomes de arquivos",
    "FILENAME": "Nome de arquivo",
    "DIRECTORY_NAME": "Nome de directorio",


    // Project error strings
    "ERROR_LOADING_PROJECT": "Erro abrindo o proxecto",
    "OPEN_DIALOG_ERROR": "Houbo un erro ó amosar o aviso de apertura de arquivo. (error {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR": "Houbo un erro ó intentar abrir o directorio <span class='dialog-filename'>{0}</span>. (erro {1})",
    "READ_DIRECTORY_ENTRIES_ERROR": "Houbo un erro ó ler os contidos do directorio <span class='dialog-filename'>{0}</span>. (erro {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE": "Erro abrindo arquivo",
    "ERROR_OPENING_FILE": "Houbo un erro ó intentar abrir o arquivo <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES": "Houbo un erro ó intentar abrir os seguintes arquivos:",
    "ERROR_RELOADING_FILE_TITLE": "Erro recargando cambios dende disco",
    "ERROR_RELOADING_FILE": "Houbo un erro ó intentar recargar o arquivo <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE": "Erro gardando arquivo",
    "ERROR_SAVING_FILE": "Houbo un erro ó intentar gardar o arquivo <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE": "Erro renomeando arquivo",
    "ERROR_RENAMING_FILE": "Houbo un erro ó intentar renomear o arquivo <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_DELETING_FILE_TITLE": "Erro eliminando arquivo",
    "ERROR_DELETING_FILE": "Houbo un erro ó intentar eliminar o arquivo <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE": "{0} inválido",
    "INVALID_FILENAME_MESSAGE": "Os {0} non poden utilizar ningunha palabra reservada polo sistema, rematar con puntos (.) ou utilizar calquera dos seguintes caracteres: <code class='emphasized'>{1}</code>",
    "ENTRY_WITH_SAME_NAME_EXISTS": "Xa existe un arquivo ou directorio co nome <span class='dialog-filename'>{0}</span>.",
    "ERROR_CREATING_FILE_TITLE": "Erro creando {0}",
    "ERROR_CREATING_FILE": "Houbo un erro ó intentar crear o {0} <span class='dialog-filename'>{1}</span>. {2}",
    "ERROR_MIXED_DRAGDROP": "Non se pode abrir o cartafol ó mesmo tempo que hai abertos outros arquivos.",

    // Application preferences corrupt error strings
    "ERROR_PREFS_CORRUPT_TITLE": "Erro lendo os axustes",
    "ERROR_PREFS_CORRUPT": "O arquivo de axustes non ten o formato JSON válido. O arquivo abrirase para que poida correxir o formato. Despois deberá reiniciar {APP_NAME} para que os cambios surtan efecto.",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE": "Vaia... parece que {APP_NAME} aínda non funciona en navegadores.",
    "ERROR_IN_BROWSER": "{APP_NAME} está desenvolvido en HTML, pero por agora funciona como unha aplicación de escritorio para que poidas editar arquivos en local. Por favor, utiliza a aplicación do repositorio <b>github.com/adobe/brackets-shell</b> para executar {APP_NAME}.",

    // FileIndexManager error string
    "ERROR_MAX_FILES_TITLE": "Erro indexando arquivos",
    "ERROR_MAX_FILES": "Este proxecto contén máis de 30.000 arquivos. Funcións que operan sobre múltiples arquivos poden estar deshabilitadas ou funcionar igual que si o proxecto estivese baleiro. <a href='https://github.com/adobe/brackets/wiki/Large-Projects'>Ler máis acerca de cómo traballar con proxectos grandes</a>.",

    // Live Preview error strings
    "ERROR_LAUNCHING_BROWSER_TITLE": "Erro iniciando navegador",
    "ERROR_CANT_FIND_CHROME": "No se puido atopar o navegador Google Chrome. Por favor, asegúrate de que está instalado correctamente.",
    "ERROR_LAUNCHING_BROWSER": "Houbo un erro ó iniciar o navegador. (erro {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE": "Erro na Vista Previa en Vivo",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE": "Conectando co navegador",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE": "Para poder iniciar o modo de Vista Previa en Vivo, Chrome debe ser iniciado habilitando a depuración remota.<br /><br />¿Queres reiniciar Chrome e habilitar a depuración remota?",
    "LIVE_DEV_LOADING_ERROR_MESSAGE": "Non se puido cargar a páxina para Vista Previa en Vivo",
    "LIVE_DEV_NEED_HTML_MESSAGE": "Abre un arquivo HTML ou asegúrate de que hai un index.html no teu proxecto para poder iniciar o modo de Vista Previa en Vivo.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE": "Necesitas especificar unha URL base neste proxecto para poder iniciar Vista Previa en Vivo con arquivos de servidor.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE": "Erro iniciando o servidor HTTP para Vista Previa en Vivo. Volve a intentalo, por favor.",
    "LIVE_DEVELOPMENT_INFO_TITLE": "¡Benvido á Vista Previa en Vivo!",
    "LIVE_DEVELOPMENT_INFO_MESSAGE": "Vista Previa en Vivo conecta {APP_NAME} co teu navegador. Lanza unha vista previa do teu arquivo HTML no navegador e actualízaa a medida que modificas o teu código.<br /><br />Nesta versión preliminar de {APP_NAME}, Desenvolvemento en Vivo só funciona para cambios de <strong>arquivos CSS ou HTML</strong> e únicamente con <strong>Google Chrome</strong>. Os cambios nos arquivos Javascript son recargados automáticamente cando se gardan.<br /><br />(Non volverás a ver ésta mensaxe.)",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING": "Para máis información, consulta <a href='{0}' title='{0}'>Resolución de Problemas de conexión en Vista Previa en Vivo</a>.",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED": "Vista Previa en Vivo",
    "LIVE_DEV_STATUS_TIP_PROGRESS1": "Vista Previa en Vivo: Conectando\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2": "Vista Previa en Vivo: Inicializando\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED": "Rematar Vista Previa en Vivo",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC": "Vista Previa en Vivo (garda o arquivo para actualizar)",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR": "Vista Previa en Vivo (non se está actualizando debido a un erro de sintaxis)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS": "Vista Previa en Vivo detiuse porque abríronse as ferramentas de desenvolvemento",
    "LIVE_DEV_DETACHED_TARGET_CLOSED": "Vista Previa en Vivo detiuse porque cerrouse a páxina no navegador",
    "LIVE_DEV_NAVIGATED_AWAY": "Vista Previa en Vivo detiuse porque accediuse a unha páxina que non é parte do proxecto actual",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON": "Vista Previa en Vivo detiuse por motivos descoñecidos ({0})",

    "SAVE_CLOSE_TITLE": "Gardar cambios",
    "SAVE_CLOSE_MESSAGE": "¿Queres gardar os cambios existentes no documento <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE": "¿Queres gardar os teus cambios nos seguintes documentos?",
    "EXT_MODIFIED_TITLE": "Cambios externos",
    "CONFIRM_DELETE_TITLE": "Confirmar eliminación",
    "CONFIRM_FOLDER_DELETE": "¿Está seguro de que desexa eliminar o directorio <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE": "Arquivo eliminado",
    "EXT_MODIFIED_WARNING": "<span class='dialog-filename'>{0}</span> foi modificado no disco.<br /><br />¿Desexa gardar o arquivo e sobrescribir eses cambios?",
    "EXT_MODIFIED_MESSAGE": "<span class='dialog-filename'>{0}</span> foi modificado, pero tamén ten cambios en {APP_NAME}.<br /><br />¿Qué versión queres conservar?",
    "EXT_DELETED_MESSAGE": "<span class='dialog-filename'>{0}</span> foi eliminado, pero ten cambios sen gardar en {APP_NAME}.<br /><br />¿Qieres conservar os teus cambios?",

    // Generic dialog/button labels
    "DONE": "Aceptar",
    "OK": "Aceptar",
    "CANCEL": "Cancelar",
    "DONT_SAVE": "Non gardar",
    "SAVE": "Gardar",
    "DELETE": "Eliminar",
    "SAVE_AS": "Gardar como\u2026",
    "SAVE_AND_OVERWRITE": "Sobrescribir",
    "BUTTON_YES": "Sí",
    "BUTTON_NO": "Non",

    // Find, Replace, Find in Files
    "FIND_MATCH_INDEX": "{0} de {1}",
    "FIND_NO_RESULTS": "Non hai resultados",
    "FIND_QUERY_PLACEHOLDER": "Atopado\u2026",
    "REPLACE_PLACEHOLDER": "Reemplazar con\u2026",
    "BUTTON_REPLACE_ALL": "Todo\u2026",
    "BUTTON_REPLACE_ALL_IN_FILES": "Reemplazar\u2026",
    "BUTTON_REPLACE": "Reemplazar",
    "BUTTON_NEXT": "\u25B6",
    "BUTTON_PREV": "\u25C0",
    "BUTTON_NEXT_HINT": "Seguinte coincidencia",
    "BUTTON_PREV_HINT": "Anterior coincidencia",
    "BUTTON_CASESENSITIVE_HINT": "Sensible a maiúsculas",
    "BUTTON_REGEXP_HINT": "Expresión regular",
    "REPLACE_WITHOUT_UNDO_WARNING_TITLE": "Reemplazar sen volta atrás",
    "REPLACE_WITHOUT_UNDO_WARNING": "Debido a que máis de {0} arquivos precisan ser cambiados, {APP_NAME} modificará arquivos non abertos.<br />Non poderás desfacer estes cambios.",
    "BUTTON_REPLACE_WITHOUT_UNDO": "Reemplazar sen volta atrás",

    "OPEN_FILE": "Abrir arquivo",
    "SAVE_FILE_AS": "Gardar arquivo",
    "CHOOSE_FOLDER": "Elixe unha carpeta",

    "RELEASE_NOTES": "Notas sobre a versión",
    "NO_UPDATE_TITLE": "¡Estás actualizado!",
    "NO_UPDATE_MESSAGE": "Estás utilizando a última versión de {APP_NAME}.",

    // Find and Replace
    "FIND_REPLACE_TITLE_LABEL": "Reemprazar",
    "FIND_REPLACE_TITLE_WITH": "con",
    "FIND_TITLE_LABEL": "Atopado",
    "FIND_TITLE_SUMMARY": "&mdash; {0} {1} {2} en {3}",

    // Find in Files
    "FIND_NUM_FILES": "{0} {1}",
    "FIND_IN_FILES_SCOPED": "en <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE": "no proxecto",
    "FIND_IN_FILES_ZERO_FILES": "O filtro exclúe tódolos arquivos {0}",
    "FIND_IN_FILES_FILE": "arquivo",
    "FIND_IN_FILES_FILES": "arquivos",
    "FIND_IN_FILES_MATCH": "coincidencia",
    "FIND_IN_FILES_MATCHES": "coincidencias",
    "FIND_IN_FILES_MORE_THAN": "Máis de ",
    "FIND_IN_FILES_PAGING": "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH": "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>",  // We should use normal dashes on Windows instead of em dash eventually
    "FIND_IN_FILES_EXPAND_COLLAPSE": "Ctrl/Cmd click para expandir/colapsar todo",
    "REPLACE_IN_FILES_ERRORS_TITLE": "Reemprazar Erros",
    "REPLACE_IN_FILES_ERRORS": "Os seguintes arquivos non se modificaron porque se cambiaron despois da búsqueda ou non poden ser modificados.",

    "ERROR_FETCHING_UPDATE_INFO_TITLE": "Erro obtendo información sobre actualizacións",
    "ERROR_FETCHING_UPDATE_INFO_MSG": "Houbo un problema ó obter a información sobre as últimas actualizacións dende o servidor. Por favor, asegúrate de estar conectado a internet e volve a intentalo.",

    // File exclusion filters
    "NEW_FILE_FILTER": "Novo conxunto de filtros\u2026",
    "CLEAR_FILE_FILTER": "Non excluir arquivos",
    "NO_FILE_FILTER": "Non hai arquivos excluidos",
    "EXCLUDE_FILE_FILTER": "Excluir {0}",
    "EDIT_FILE_FILTER": "Editar\u2026",
    "FILE_FILTER_DIALOG": "Editar conxunto de filtros",
    "FILE_FILTER_INSTRUCTIONS": "Excluir arquivos e carpetas que coincidan con algunha das seguintes cadeas / subcadeas ou <a href='{0}' title='{0}'>comodines</a>. Ingrese unha cadea por liña.",
    "FILTER_NAME_PLACEHOLDER": "Nomear este conxunto de filtros (opcional)",
    "FILE_FILTER_CLIPPED_SUFFIX": "e {0} máis",
    "FILTER_COUNTING_FILES": "Contando arquivos\u2026",
    "FILTER_FILE_COUNT": "Permite {0} de {1} arquivos {2}",
    "FILTER_FILE_COUNT_ALL": "Permite tódolos {0} arquivos {1}",

    // Quick Edit
    "ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND": "A Edición Rápida non está dispoñible para a posición actual do cursor",
    "ERROR_CSSQUICKEDIT_BETWEENCLASSES": "Edición Rápida para CSS: ubique o cursor sobre o nome de unha clase",
    "ERROR_CSSQUICKEDIT_CLASSNOTFOUND": "Edición Rápida para CSS: atributo de clase incompleto",
    "ERROR_CSSQUICKEDIT_IDNOTFOUND": "Edición Rápida para CSS: atributo de identificación incompleto",
    "ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR": "Edición Rápida para CSS: ubique o cursor sobre unha etiqueta, clase ou id",
    "ERROR_TIMINGQUICKEDIT_INVALIDSYNTAX": "Edición Rápida para Funcións de Temporización de CSS: sintaxis inválida",
    "ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND": "Edición Rápida para JS: ubique o cursor sobre o nome de unha función",

    // Quick Docs
    "ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND": "A Documentación Rápida non está dispoñible para a posición actual do cursor",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING": "Cargando\u2026",
    "UNTITLED": "Sen título",
    "WORKING_FILES": "Área de traballo",

    /**
     * MainViewManager
     */
    "TOP": "Arriba",
    "BOTTOM": "Abaixo",
    "LEFT": "Esquerda",
    "RIGHT": "Dereita",

    "CMD_SPLITVIEW_NONE": "Non Dividir",
    "CMD_SPLITVIEW_VERTICAL": "División Vertical",
    "CMD_SPLITVIEW_HORIZONTAL": "División Horizontal",
    "SPLITVIEW_MENU_TOOLTIP": "Dividir o editor vertical ou horizontalmente",
    "GEAR_MENU_TOOLTIP": "Configurar espacio de traballo",

    "SPLITVIEW_INFO_TITLE": "Xa está aberto",
    "SPLITVIEW_MULTIPANE_WARNING": "O arquivo xa está aberto noutro panel. {APP_NAME} pronto soportará abrir o mesmo arquivo noutro panel. Ata entón, o arquivo amosarase no panel que xa está aberto en.<br /><br />(Só verás esta mensaxe unha vez.)",


    /**
     * Keyboard modifier names
     */
    "KEYBOARD_CTRL": "Ctrl",
    "KEYBOARD_SHIFT": "May",
    "KEYBOARD_SPACE": "Espacio",

    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION": "Liña {0}, Columna {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR": " \u2014 {0} columna seleccionada",
    "STATUSBAR_SELECTION_CH_PLURAL": " \u2014 {0} columnas seleccionadas",
    "STATUSBAR_SELECTION_LINE_SINGULAR": " \u2014 {0} liña seleccionada",
    "STATUSBAR_SELECTION_LINE_PLURAL": " \u2014 {0} liñas seleccionadas",
    "STATUSBAR_SELECTION_MULTIPLE": " \u2014 {0} seleccións",
    "STATUSBAR_INDENT_TOOLTIP_SPACES": "Fai click para usar espacios na sangría",
    "STATUSBAR_INDENT_TOOLTIP_TABS": "Fai click para usar tabulacións na sangría",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES": "Fai click para cambiar o número de espacios usados na sangría",
    "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS": "Fai click para cambiar o ancho das tabulacións",
    "STATUSBAR_SPACES": "Espacios:",
    "STATUSBAR_TAB_SIZE": "Tamaño de tabulador:",
    "STATUSBAR_LINE_COUNT_SINGULAR": "\u2014 {0} liña",
    "STATUSBAR_LINE_COUNT_PLURAL": "\u2014 {0} liñas",
    "STATUSBAR_USER_EXTENSIONS_DISABLED": "Extensións deshabilitadas",
    "STATUSBAR_INSERT": "INS",
    "STATUSBAR_OVERWRITE": "SOB",
    "