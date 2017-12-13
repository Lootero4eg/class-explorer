import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Branch, ISourceFileModel } from './common';

let a = 1;

export class ClassExplorerProvider implements vscode.TreeDataProvider<Branch>, vscode.TextDocumentContentProvider {

    private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
	readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;

    private model: ISourceFileModel = null;

	constructor(filemodel: ISourceFileModel){
        this.model = filemodel;
    }
    
    getTreeItem(element: Branch): vscode.TreeItem {
        return {
			label: element.Name,
			collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
			command: null,		
			iconPath: {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'folder.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'folder.svg')
			}
		};
		//return element;
    }
    
    getChildren(element?: Branch): Branch[] | Branch[] {        
		if (!element) {
			if (!this.model) {
				return [];
			}

        return this.model.getTree();            
        }

        //return this.model.getChildren(element);
    }

    public provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
		return null;
	}
}