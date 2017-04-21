---
layout: default
title: OpenProcessToken
categories: 前端
---

### [window-API] OpenProcessToken函数


```c#
/* hello world demo */
BOOL CreateProcess(
    LPCTSTR lpApplicationName, // 应用程序名称  
    LPTSTR lpCommandLine, // 命令行字符串  
    LPSECURITY_ATTRIBUTES lpProcessAttributes, // 进程的安全属性  
    LPSECURITY_ATTRIBUTES lpThreadAttributes, // 线程的安全属性  
    BOOL bInheritHandles, // 是否继承父进程的属性  
    DWORD dwCreationFlags, // 创建标志  
    LPVOID lpEnvironment, // 指向新的环境块的指针  
    LPCTSTR lpCurrentDirectory, // 指向当前目录名的指针  
    LPSTARTUPINFO lpStartupInfo, // 传递给新进程的信息  
    LPPROCESS_INFORMATION lpProcessInformation // 新进程返回的信息  
); 
int main()
{
    printf("Hello World");
    return 0;
}
```