import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Branch, ISourceFileModel, BranchType } from './common';

let a = 1;

export class ClassExplorerProvider implements vscode.TreeDataProvider<Branch>, vscode.TextDocumentContentProvider {

    private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
	readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;

    private model: ISourceFileModel = null;

	constructor(filemodel: ISourceFileModel){
        this.model = filemodel;
    }
    
    getTreeItem(element: Branch): vscode.TreeItem {
		
		let treeItem: vscode.TreeItem = {
			label: element.Name,
			collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
			command: null,		
			/*iconPath: {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'folder.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'folder.svg')
			}*/
		};

		if(element.Icon == 0){
			treeItem.iconPath = {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'folder.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'folder.svg')
			};
		}

		if(element.Icon == 1){
			treeItem.iconPath = {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'document.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'document.svg')
			};
		}

		if(element.Icon == 2){
			treeItem.iconPath = {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'string.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'string.svg')
			};
			treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;
		}		

		if(element.Icon == 3 || element.Icon == 4){
			/*treeItem.iconPath = {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'number.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'number.svg')
			};*/

			treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		}

		//--non collapsible items
		if(element.Type == BranchType.Const || element.Type == BranchType.Property || element.Type == BranchType.Method){
			treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;
		}

		return treeItem;
    }
    
    getChildren(element?: Branch):Branch[] {        
		if (!element) {
			if (!this.model) {
				return [];
			}

			let root:Branch[] = this.model.getTree();
			return root;			
        }
		
		if(element.Nodes.length > 0)
			return element.Nodes;			
    }

    public provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
		return null;
	}
}