/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { join } from 'path';
import {
	ExtensionContext,
	languages,
	TextDocument,
	Range,
	FormattingOptions,
	CancellationToken,
	TextEdit, workspace
} from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

import Formatter from './formatter/Formatter';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
	languages.registerDocumentRangeFormattingEditProvider('wlanguage', {
		provideDocumentRangeFormattingEdits(document: TextDocument, range: Range, _options: FormattingOptions, _token: CancellationToken): TextEdit[] {
			let start = document.offsetAt(range.start);
			let end = document.offsetAt(range.end) - 1; // Make the end inclusive.
			let code = document.getText(range);

			const formatter = new Formatter(code);
			let text = formatter.formatText();

			const resultRange = range.with(document.positionAt(start), document.positionAt(end + 1));

			return [TextEdit.replace(resultRange, text)];
		}
	});

	// The server is implemented in node
	const serverModule = context.asAbsolutePath(
		join('server', 'out', 'server.js')
	);

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
		}
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'wlanguage' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'WLanguageServer',
		'WLanguage Server',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
