import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Branch, ISourceFileModel, BranchType } from './common';

export class ClassExplorerProvider implements vscode.TreeDataProvider<Branch>, vscode.TextDocumentContentProvider {

    private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
	readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;

	private model: ISourceFileModel = null;	
	private root:Branch[] = null;

	constructor(filemodel: ISourceFileModel){
		this.model = filemodel;

		vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {								
				this.refresh();
            }
        });        
    }
    
    public getTreeItem(element: Branch): vscode.TreeItem {		
		let treeItem: vscode.TreeItem = {
			label: element.Name,
			collapsibleState: vscode.TreeItemCollapsibleState.Expanded,			
			command: {command: 'classExplorerGoToDefinition', arguments:[element] , title: element.Name}
		};	

		if(element.Type == BranchType.Constant){
			treeItem.iconPath = {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'constant.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'constant.svg')
			};
			treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;
		}		
		
		if(element.Type == BranchType.Properties || element.Type == BranchType.Methods 
			|| element.Type == BranchType.Interfaces || element.Type == BranchType.Constants){
			treeItem.iconPath = {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'folder.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'folder.svg')
			};

			treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
			treeItem.command = null;
		}

		//--non collapsible items
		if(element.Type == BranchType.Constant 
			|| element.Type == BranchType.Property || element.Type == BranchType.PrivateProperty|| element.Type == BranchType.ProtectedProperty|| element.Type == BranchType.PublicProperty
			|| element.Type == BranchType.Method || element.Type == BranchType.PrivateMethod|| element.Type == BranchType.ProtectedMethod|| element.Type == BranchType.PublicMethod){
			treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;			
		}

		if(element.Type == BranchType.AbstractClass){
			treeItem.iconPath = {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'abstractclass.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'light', 'abstractclass.svg')
			};			
		}

		if(element.Type == BranchType.Class){
			treeItem.iconPath = {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'class.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'light', 'class.svg')
			};			
		}	

		if(element.Type == BranchType.PrivateMethod){
			treeItem.iconPath = {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'methodprivate.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'light', 'methodprivate.svg')
			};			
		}

		if(element.Type == BranchType.ProtectedMethod){
			treeItem.iconPath = {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'methodprotect.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'light', 'methodprotect.svg')
			};			
		}

		if(element.Type == BranchType.PublicMethod){
			treeItem.iconPath = {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'method.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'light', 'methodp.svg')
			};			
		}

		if(element.Type == BranchType.PrivateProperty){
			treeItem.iconPath = {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'propertyprivate.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'light', 'propertyrivate.svg')
			};			
		}

		if(element.Type == BranchType.ProtectedProperty){
			treeItem.iconPath = {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'propertyprotect.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'light', 'propertyprotect.svg')
			};			
		}

		if(element.Type == BranchType.PublicProperty){
			treeItem.iconPath = {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'property.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'light', 'property.svg')
			};			
		}

		if(element.Type == BranchType.Interface){
			treeItem.iconPath = {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'interface.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'light', 'interface.svg')
			};			
		}

		if(element.Type == BranchType.Methods){
			treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
		}


		return treeItem;
    }
    
    public getChildren(element?: Branch):Branch[] {        
		if (!element) {
			if (!this.model) {
				return [];
			}

			if(this.root == null)
				this.root = this.model.getTree();
			return this.root;			
        }
		
		if(element.Nodes.length > 0)
			return element.Nodes;			
    }

	public refresh(): void{
		this.model.setEditor(vscode.window.activeTextEditor);
		this.root = this.model.getTree();		
		this._onDidChangeTreeData.fire();
	}

    public provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
		return null;
	}

	public selectActiveNodeByLine(linenum: number){
		//--There are no API for selecting node... Wainting for API.		
	}
}