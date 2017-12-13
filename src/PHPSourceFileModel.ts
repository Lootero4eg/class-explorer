import {TextEditor} from 'vscode';
import { Branch, ISourceFileModel, BranchType } from './common';

export class PHPSourceFileModel implements ISourceFileModel{
    private editor: TextEditor = null;
    
    constructor(activeEditor: TextEditor){
        this.editor = activeEditor;
    }

    public getTree(): Branch[]{
        let phpfile: string = this.editor.document.getText();
        let classnames: string[] = phpfile.match(/class.*/g);
        let branch: Branch = new Branch();

        if(classnames != null && classnames.length > 0){
            if(classnames.length >= 2){
                branch.Type = BranchType.Classes;
                branch.Name = "Classes";
                branch.StartLine = 0;
                branch.EndLine = 0;
                branch.Icon = 1;  
                branch.Nodes = [];
                //this.getChildBranch2(branch)
            }
            
        }
        
        branch.Name="MyClass";
        branch.Icon=1;
        branch.Type = BranchType.Class;

        let res: Branch[] = [];
        //branch.Nodes = this.getChildren(branch.Nodes[0]);

        res.push(branch);

        return res;
    }
    
    public getChildren(node: Branch): Branch[]{
        return null;
    }

    private getChildren2(node: Branch, array: string[], btype: BranchType): Branch[]{
        return null;
    }
}