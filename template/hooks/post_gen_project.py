#!/usr/bin/env python3
"""
Post-generation hook for AppAnySite Template
Copies source files that should not be processed by Jinja2
"""

import os
import shutil

def main():
    """Copy source files after project generation"""
    project_dir = os.getcwd()
    
    # Find the template directory by looking for the hooks directory
    # Start from the current directory and go up until we find hooks
    current_dir = project_dir
    template_dir = None
    
    while current_dir != os.path.dirname(current_dir):  # Stop at root
        hooks_dir = os.path.join(current_dir, "hooks")
        if os.path.exists(hooks_dir) and os.path.isdir(hooks_dir):
            template_dir = current_dir
            break
        current_dir = os.path.dirname(current_dir)
    
    if template_dir is None:
        print("❌ Error: Could not find template directory with hooks folder")
        return
    
    source_dir = os.path.join(template_dir, "hooks", "source")
    
    print("🚀 Post-generation: Copying source files...")
    
    # Files to copy from hooks/source to the generated project
    files_to_copy = [
        "src/",
        "app-config.json",
        "App.tsx"
    ]
    
    # Copy each file/directory
    for item in files_to_copy:
        src_path = os.path.join(source_dir, item)
        dst_path = os.path.join(project_dir, item)
        
        if os.path.exists(src_path):
            if os.path.isdir(src_path):
                # Copy directory
                if os.path.exists(dst_path):
                    shutil.rmtree(dst_path)
                shutil.copytree(src_path, dst_path)
                print(f"📁 Copied directory: {item}")
            else:
                # Copy file
                shutil.copy2(src_path, dst_path)
                print(f"📄 Copied file: {item}")
        else:
            print(f"⚠️  Warning: Source not found: {src_path}")
    
    print("✅ Post-generation completed successfully!")

if __name__ == "__main__":
    main()
