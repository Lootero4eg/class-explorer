import {TextEditor, Position} from 'vscode';
import { Branch, ISourceFileModel, BranchType } from './common';
import { connect } from 'http2';

export class PHPSourceFileModel implements ISourceFileModel{
    public editor: TextEditor = null;
    private phpfile: string = null;
    private cleanText: string = null;
    public commentedLines: number[] = [];
    
    constructor(activeEditor: TextEditor){
        this.editor = activeEditor;
        this.phpfile = this.editor.document.getText();
        this.cleanText = this.ClearComments(this.phpfile);
        this.GetCommentedLines(this.phpfile);
    }

    public getTree(): Branch[]{                       
        let res: Branch[] = this.getChildren2(null);        

        return res;
    }
    
    public getChildren(node: Branch): Branch[]{
        return null;
    }

    private getChildren2(node: Branch): Branch[]{        
        let ifaces:Branch[] = [];
        let classes:Branch[] = [];
        let consts:Branch[] = [];
        let properties:Branch[] = [];
        let methods:Branch[] = [];
        let res: Branch[] = [];
        let tmpContent = null;

        let nextBranch: Branch = null;

        if(node == null){ //--get root
            node = this.InitNewBranch();            
            node.Type = BranchType.Namespace;
            node.Name = "Namespace";            
        }

        switch(node.Type){
            case BranchType.Namespace:
                let namespaces: string[] = this.phpfile.match(/namespace.*/g);
                if(namespaces != null && namespaces.length > 0){
                    for(var i = 0; i < namespaces.length; i++) {
                        let namespace: string = namespaces[i].replace(/^.*namespace (.*?);/,"$1");
                        if(namespace != namespaces[i]){
                            node.Name = namespace;   
                            break;                         
                        }                   
                    } 
                }                
                nextBranch = node;
                if(node.Name != "Namespace"){                    
                    nextBranch = this.InitNewBranch();
                }
                                
                nextBranch.Name = "Interfaces";
                nextBranch.Type = BranchType.Interfaces;                                                
                ifaces = this.getChildren2(nextBranch);
                
                if(ifaces != [] && ifaces.length > 0){
                    if(ifaces[0].Nodes.length > 0){
                        nextBranch.Nodes = nextBranch.Nodes.concat(ifaces);
                        res.push(nextBranch);
                    }
                }
                
                nextBranch = this.InitNewBranch();
                nextBranch.Name = "Classes";
                nextBranch.Type = BranchType.Classes;                                                
                classes = this.getChildren2(nextBranch);

                if(classes != [] && classes.length > 0){  
                    if(classes[0].Nodes.length > 0){                 
                        nextBranch.Nodes = nextBranch.Nodes.concat(classes);
                        res.push(nextBranch);          
                    }          
                }                
                return res;

            case BranchType.Interfaces:
                let interfaces: string[] = this.cleanText.match(/interface\s\w+/gi);
                if(interfaces != null && interfaces.length > 0){
                    for(var i = 0; i < interfaces.length; i++) {
                        nextBranch = this.InitNewBranch();
                        nextBranch.Name = "Interface";                        
                        nextBranch.Type = BranchType.Interface;                        
                        nextBranch.SearchPattern = interfaces[i];
                        ifaces = ifaces.concat(this.getChildren2(nextBranch));
                        if(ifaces[0].Nodes != [] && ifaces[0].Nodes[0] != null)
                            ifaces[0].Nodes[0].Parent = ifaces[0];
                    }
                                        
                    return ifaces;                    
                }
                break;

            case BranchType.Interface:
                let interfaceName: string =  this.FixWhiteSpaces(node.SearchPattern.replace(/^.*interface\s(.*?)/i,"$1"));                
                interfaceName = this.CleanString(interfaceName); 

                node.StartLine = this.SearchLineNumber(interfaceName.replace(/\s*(.*)/,"$1"),this.phpfile);    
                node.Name = interfaceName;                                                                              
                node = this.GetClassOrInterfaceEnvironment(node);
                ifaces.push(node);
                return ifaces;

            case BranchType.Classes:                                
                //let classnames: string[] = this.cleanText.match(/class\s*\w+/g);
                let classnames: string[] = this.cleanText.match(/(public|protected|private)?\s*(abstract)?\s*class\s*\w+/g);
                if(classnames != null && classnames.length > 0){
                    for(var i = 0; i < classnames.length; i++) {
                        nextBranch = this.InitNewBranch();
                        nextBranch.Name = "Class";                        
                        nextBranch.Type = BranchType.Class;                        
                        nextBranch.SearchPattern = classnames[i];
                        classes = classes.concat(this.getChildren2(nextBranch));
                        if(classes[0].Nodes != [] && classes[0].Nodes[0] != null)
                            classes[0].Nodes[0].Parent = classes[0];
                    }
                                        
                    return classes;                    
                }
                break;

            case BranchType.Class:
                let classname: string =  this.FixWhiteSpaces(node.SearchPattern.replace(/^.*class\s(.*?)/,"$1"));                                
                classname = this.CleanString(classname);
                let abstract: String = classname.replace(/(public|protected|private)?\s*(abstract)?\s*class\s*(\w+)/i,"$2");
                classname = classname.replace(/(public|protected|private)?\s*(abstract)?\s*class\s*(\w+)/i,"$3");
                                
                node.Type = BranchType.Class;
                if(abstract == "abstract")
                    node.Type = BranchType.AbstractClass;
                node.StartLine = this.SearchLineNumber(classname.replace(/\s*(.*)/,"$1"),this.phpfile);    
                node.Name = classname;                                                                                    
                node = this.GetClassOrInterfaceEnvironment(node);
                
                classes.push(node);
                return classes;                

                case BranchType.Constants:
                    tmpContent = this.GetBracketsContent(this.cleanText,node.Parent.SearchPattern,"{","}");
                    let constants: string[] = tmpContent.match(/const\s+.*/gi);
                    if(constants == null)
                        break;
                    for(var i=0; i< constants.length; i++){
                        let constant: string = constants[i].replace(/const\s*(\w+).*;/i,"$1");
                        constant = this.CleanString(constant);
                        let constBranch: Branch = this.InitNewBranch(node);
                        constBranch.StartLine = this.SearchLineNumber(constants[i].replace(/\s*(.*)/,"$1"),this.phpfile);
                        constBranch.Type = BranchType.Constant;
                        constBranch.Name = constant;                        
                        consts.push(constBranch);
                    }
                    node.Nodes = consts;
                    break;
                
                case BranchType.Constant://--not used
                    node = null;
                    break;
                
                case BranchType.Properties:                    
                    tmpContent = this.GetBracketsContent(this.cleanText,node.Parent.SearchPattern,"{","}");
                    let props: string[] = tmpContent.match(/(public|protected|private)\s*(static)?\s*\$\w+\s*.*;/gi);                    
                    props = (props == null ? [] : props);

                    for(var i=0; i< props.length; i++){                        
                        let modifier: string = props[i].replace(/(public|protected|private)\s*(static)?\s*\$\w+\s*.*;/i,"$1");
                        let property: string = props[i].replace(/\s*.*(\$\w+)\s*.*;/,'$1');
                        property = this.CleanString(property);
                        let propBranch: Branch = this.InitNewBranch(node);
                        propBranch.Type = BranchType.PublicProperty;
                        if(modifier == "private")
                            propBranch.Type = BranchType.PrivateProperty;
                        if(modifier == "protected")
                            propBranch.Type = BranchType.ProtectedProperty;
                        if(modifier == "public")
                            propBranch.Type = BranchType.PublicProperty;
                        
                        propBranch.StartLine = this.SearchLineNumber(props[i].replace(/\s*(.*)/,"$1"),this.phpfile);
                        propBranch.Name = property;                        
                        properties.push(propBranch);
                    }
                    node.Nodes = properties;
                    break;
                case BranchType.Property://--not used
                    node = null;
                    break;
                case BranchType.Methods:
                    tmpContent = this.GetBracketsContent(this.cleanText,node.Parent.SearchPattern,"{","}");
                    let methodsArr: string[] = tmpContent.match(/(public|protected|private)?\s*(static)?\s*function\s*(\w+)\s*/gi);
                    methodsArr = (methodsArr != null ? methodsArr : []);

                    for(var i=0; i< methodsArr.length; i++){
                        //this.editor.document.                        
                        let modifier: string = methodsArr[i].replace(/(public|protected|private)\s*(static)?\s*function\s*(\w+)\s*/i,"$1");
                        let method: string = methodsArr[i].replace(/.*function\s*(\w+)\s*/i,"$1");
                        method = this.CleanString(method);
                        let methodBranch: Branch = this.InitNewBranch(node);

                        //--тут будут проблемы с закоментированными строками...
                        methodBranch.StartLine = this.SearchLineNumber(methodsArr[i].replace(/\s*(.*)/,"$1"),this.phpfile);
                        /*let standardPosition: number = this.phpfile.indexOf(methodsArr[i].replace(/\s*(.*)/,"$1"));
                        if(standardPosition >= 0){
                            let pos:Position = this.editor.document.positionAt(standardPosition);
                            methodBranch.StartLine = pos.line;
                        }*/

                        methodBranch.Type = BranchType.PublicMethod;
                        if(modifier == "private")
                            methodBranch.Type = BranchType.PrivateMethod;
                        if(modifier == "protected")
                            methodBranch.Type = BranchType.ProtectedMethod;
                        if(modifier == "public")
                            methodBranch.Type = BranchType.PublicMethod;
                        methodBranch.Name = method;                        
                        methods.push(methodBranch);
                    }
                    node.Nodes = methods;
                    break;
                case BranchType.Method://--not used
                    node = null;
                    break;                    
        }        

        if(node != null)
            res.push(node);
        return res;
    } 
    
    private InitNewBranch(parent: Branch = null): Branch{
        let branch: Branch = new Branch();
        branch.Type = BranchType.None;
        branch.Name = "";
        branch.StartLine = 0;
        //branch.EndLine = 0;        
        branch.Nodes = [];
        branch.SearchPattern = "";
        branch.Parent = parent;

        return branch;
    }

    private ClearComments(s: string): string{
        s = s.replace(/\s*(.*?)\s*(\/\/.*).*$/g,"$1");
        s = s.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/g,"");
        s = s.replace(/\/\/[\s\S].*$/gm,"");

        return s;
    }

    private CleanString(s: string): string{
        s = this.ClearComments(s);
        s = s.replace("{","");
        s = s.replace("}","");
        s = s.replace("(","");
        s = s.replace(")","");
        s = s.trim();

        return s;
    }

    private FixWhiteSpaces(s: string): string{
        s = s.replace(/  +/g, ' ');

        return s;
    }

    private RemoveWhiteSpaces(s: string): string{
        s = s.replace(/ /g, '');

        return s;
    }

    private GetBracketsContent(content:string, searchPattern: string, open_bracket: string, close_bracket: string): string{
        let startSearchingPosioton: number = content.indexOf(searchPattern);
        let startPosition: number = 0;
        let endPosition: number = 0;
        let innerOpenedBracketsCount = 0;
        
        if(startSearchingPosioton < 0)
            return null;

        startSearchingPosioton += searchPattern.length;

        for(var i = startSearchingPosioton; i < (content.length + startSearchingPosioton)+1; i++){
            if(content[i] == open_bracket && startPosition == 0){
                startPosition = i;
                continue;
            }
            
            if(content[i] == open_bracket){
                innerOpenedBracketsCount++;
            }

            if(content[i] == close_bracket){
                if(innerOpenedBracketsCount>0)
                    innerOpenedBracketsCount--;
                else{
                    endPosition = i;
                    break;
                }
            }
        }

        if(startPosition >= endPosition)
            return null;

        return content.substring(startPosition, endPosition+1);
    }

    private GetClassOrInterfaceEnvironment(node: Branch): Branch{                                                                          
        let consts:Branch[] = [];
        let properties:Branch[] = [];
        let methods:Branch[] = [];

        let nextBranch: Branch = this.InitNewBranch(node);
        nextBranch.Parent = node;                        
        nextBranch.Name = "Constants";
        nextBranch.Type = BranchType.Constants;        
        consts = this.getChildren2(nextBranch);

        nextBranch = this.InitNewBranch(node);                        
        nextBranch.Parent = node;
        nextBranch.Name = "Properties";
        nextBranch.Type = BranchType.Properties;              
        properties = this.getChildren2(nextBranch);

        nextBranch = this.InitNewBranch(node);                        
        nextBranch.Parent = node;
        nextBranch.Name = "Methods";
        nextBranch.Type = BranchType.Methods;      
        methods = this.getChildren2(nextBranch);
        
        if(consts[0].Nodes.length > 0)
            node.Nodes = node.Nodes.concat(consts);

        if(properties[0].Nodes.length > 0)
            node.Nodes = node.Nodes.concat(properties);

        if(methods[0].Nodes.length > 0)
            node.Nodes = node.Nodes.concat(methods);

        return node;
    }

    private GetCommentedLines(content: string): void {
        this.commentedLines = [];
        let singleLinesComments: string[] = content.match(/^\s+\/\/.*$/gm);
        let blockLinesComments: string[] = content.match(/\/\*[\s\S]*\*\//);

        singleLinesComments != null ? singleLinesComments : [];
        for(var i = 0; i < singleLinesComments.length; i++){
            let standardPosition: number = content.indexOf(singleLinesComments[i]);
            let pos: Position = this.editor.document.positionAt(standardPosition);
            if(this.commentedLines.indexOf(pos.line) < 0)
                this.commentedLines.push(pos.line);
            
            content = content.replace(singleLinesComments[i],
                singleLinesComments[i].replace(/(.*)\/\/(.*)/g,"$1") 
                + singleLinesComments[i].replace(/.*(\/\/.*)/,"$1").replace(/[\s\S]/g,'z'));
        }

        blockLinesComments != null ? blockLinesComments : [];
        for(var i = 0; i < blockLinesComments.length; i++){
            let startPosition: number = content.indexOf(blockLinesComments[i]);
            let endPosition: number = startPosition + (blockLinesComments[i].length - 1);            
            for(var j = startPosition; j < endPosition;j++){
                let pos: Position = this.editor.document.positionAt(j);
                if(this.commentedLines.indexOf(pos.line) < 0)
                    this.commentedLines.push(pos.line);             
            }                
        }
    }

    private SearchLineNumber(searchPattern: string, content: string): number {
        let idx: number = 0;
        let standardPosition: number = 0;        

        while(true){
            standardPosition = content.indexOf(searchPattern, idx);
            if(standardPosition >= 0){
                let pos:Position = this.editor.document.positionAt(standardPosition);
                if(!this.IsCommentedLine(pos.line))
                    return pos.line;
                idx = standardPosition + 1;
            }
            else
                break;            
        }        

        return 0;
    }

    private IsCommentedLine(linenumber: number): boolean {
        for(var i = 0;i < this.commentedLines.length; i++){
            if(linenumber == this.commentedLines[i])
                return true;            
        }

        return false;
    }

    /*private EscapeRegExpString(s: string): string{
        s = s.replace("^", "\^");
        s = s.replace("$", "\$");
        s = s.replace("(", "\(");
        s = s.replace(")", "\)");
        s = s.replace("[", "\[");
        s = s.replace("]", "\]");
        s = s.replace("*", "\*");
        s = s.replace(".", "\.");
        
        return s;
    }*/
}