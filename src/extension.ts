'use strict';

import * as vscode from 'vscode';

import { ClassExplorerProvider } from './ClassExplorer';
import { PHPSourceFileModel } from './PHPSourceFileModel';
import { Branch } from './common';

export function activate(context: vscode.ExtensionContext) {
	const rootPath = vscode.workspace.rootPath;

	let classExplorerProvider:ClassExplorerProvider = null;			
	let subscriptions: vscode.Disposable[] = [];
	let controller: TextEditorUpdater = new TextEditorUpdater();

	context.subscriptions.push(controller);

	let disposable = vscode.commands.registerCommand('extension.testClassExplorer', () => {        
        vscode.window.showInformationMessage('!activated!');
    });

    context.subscriptions.push(disposable);	
}

class TextEditorUpdater{
	public classExplorerProvider:ClassExplorerProvider = null;
	private _disposable: vscode.Disposable;	
	
	constructor(){		
		if (vscode.window.activeTextEditor.document.languageId === "php") {
			this.classExplorerProvider = new ClassExplorerProvider(new PHPSourceFileModel(vscode.window.activeTextEditor));
			vscode.window.registerTreeDataProvider('classExplorer', this.classExplorerProvider);
			
			vscode.commands.registerCommand('classExplorerGoToDefinition', (node: Branch) => {						
				let editor = vscode.window.activeTextEditor;
				let range = editor.document.lineAt(node.StartLine).range;				
				editor.selection =  new vscode.Selection(range.start, range.end);
				editor.revealRange(range);
			});
		}
		
		let subscriptions: vscode.Disposable[] = [];
		vscode.window.onDidChangeActiveTextEditor(this._onActiveTextEditorChanged, this, subscriptions);
		//vscode.window.onDidChangeTextEditorSelection(this._onDidChangeTextEditorSelection, this, subscriptions);
		vscode.workspace.onDidSaveTextDocument(this._onActiveTextEditorChanged, this);
		this._disposable = vscode.Disposable.from(...subscriptions);
	}

	private _onActiveTextEditorChanged() {
		this.classExplorerProvider = new ClassExplorerProvider(new PHPSourceFileModel(vscode.window.activeTextEditor));
		vscode.window.registerTreeDataProvider('classExplorer', this.classExplorerProvider);		
	}

	private _onDidChangeTextEditorSelection() {
		//this.classExplorerProvider.selectActiveNodeByLine(1);
	}

	dispose() {
        this._disposable.dispose();
    }
}

