module.exports = [
  "[project]/app/(pages)/issue/page.tsx [app-ssr] (ecmascript)",
  (__turbopack_context__) => {
    "use strict"

    __turbopack_context__.s(["default", () => IssuePage])
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)",
      )
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)",
      )
    var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$icon$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/components/icon.tsx [app-ssr] (ecmascript)",
      )
    var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$issue$2d$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/components/issue-card.tsx [app-ssr] (ecmascript)",
      )
    ;("use client")
    function IssuePage() {
      const [category, setCategory] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
        "useState"
      ])(CATEGORIES[0].value)
      const [issues, setIssues] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
        "useState"
      ])(ISSUES)
      const [score, setScore] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
        "useState"
      ])(ME.score)
      const list = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
        "useMemo"
      ])(
        () =>
          category === "all"
            ? issues
            : issues.filter((i) => i.category === category),
        [category, issues],
      )
      const votedCount = issues.filter((i) => i.status === "voted").length
      /** 투표하면 그 순간부터 본인에게만 비율이 열립니다. */ function handleVote(
        id,
        choice,
      ) {
        setIssues((prev) =>
          prev.map((i) =>
            i.id === id
              ? {
                  ...i,
                  status: "voted",
                  myChoice: choice,
                  participants: i.participants + 1,
                  ratio: i.ratio ?? {
                    yes: 17,
                    no: 83,
                  },
                }
              : i,
          ),
        )
      }
      const progress = Math.min(100, (score / ME.nextTierAt) * 100)
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
        "jsxDEV"
      ])(
        "div",
        {
          className: "flex flex-col gap-[22px] px-6 pt-8 pb-11",
          children: [
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
              "jsxDEV"
            ])(
              "section",
              {
                className: "flex flex-col gap-3",
                children: [
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                    "jsxDEV"
                  ])(
                    "div",
                    {
                      className:
                        "text-ink-subtle text-xs font-bold tracking-[0.05em]",
                      children: "카테고리",
                    },
                    void 0,
                    false,
                    {
                      fileName: "[project]/app/(pages)/issue/page.tsx",
                      lineNumber: 45,
                      columnNumber: 9,
                    },
                    this,
                  ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                    "jsxDEV"
                  ])(
                    "div",
                    {
                      className: "flex items-center gap-2",
                      children: [
                        CATEGORIES.map((c) => {
                          const active = c.value === category
                          return /*#__PURE__*/ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                            "jsxDEV"
                          ])(
                            "button",
                            {
                              type: "button",
                              onClick: () => setCategory(c.value),
                              className: active
                                ? "bg-ink inline-flex items-center gap-[7px] rounded-full px-[17px] py-2.5 text-sm leading-none font-extrabold tracking-[-0.02em] text-bg"
                                : "border-line text-ink-muted hover:text-ink inline-flex items-center gap-[7px] rounded-full border bg-card px-[17px] py-2.5 text-sm leading-none font-bold tracking-[-0.02em] transition-colors",
                              children: [
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                  "jsxDEV"
                                ])(
                                  __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$icon$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                    "Icon"
                                  ],
                                  {
                                    name: c.icon,
                                    size: 17,
                                    style: {
                                      color: active ? "var(--bg)" : c.color,
                                    },
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      "[project]/app/(pages)/issue/page.tsx",
                                    lineNumber: 62,
                                    columnNumber: 17,
                                  },
                                  this,
                                ),
                                c.label,
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                  "jsxDEV"
                                ])(
                                  "span",
                                  {
                                    className: `text-[11.5px] font-bold tabular-nums ${active ? "text-[color:color-mix(in_oklab,var(--bg)_50%,transparent)]" : "text-ink-faint"}`,
                                    children: c.count,
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      "[project]/app/(pages)/issue/page.tsx",
                                    lineNumber: 68,
                                    columnNumber: 17,
                                  },
                                  this,
                                ),
                              ],
                            },
                            c.value,
                            true,
                            {
                              fileName: "[project]/app/(pages)/issue/page.tsx",
                              lineNumber: 52,
                              columnNumber: 15,
                            },
                            this,
                          )
                        }),
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                          "jsxDEV"
                        ])(
                          "div",
                          {
                            className: "flex-auto",
                          },
                          void 0,
                          false,
                          {
                            fileName: "[project]/app/(pages)/issue/page.tsx",
                            lineNumber: 81,
                            columnNumber: 11,
                          },
                          this,
                        ),
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                          "jsxDEV"
                        ])(
                          "button",
                          {
                            type: "button",
                            className:
                              "text-ink-subtle inline-flex items-center gap-1.5 text-[13px] font-bold",
                            children: [
                              "마감 임박순",
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                "jsxDEV"
                              ])(
                                __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$icon$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                  "Icon"
                                ],
                                {
                                  name: "expand_more",
                                  size: 16,
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    "[project]/app/(pages)/issue/page.tsx",
                                  lineNumber: 88,
                                  columnNumber: 13,
                                },
                                this,
                              ),
                            ],
                          },
                          void 0,
                          true,
                          {
                            fileName: "[project]/app/(pages)/issue/page.tsx",
                            lineNumber: 83,
                            columnNumber: 11,
                          },
                          this,
                        ),
                      ],
                    },
                    void 0,
                    true,
                    {
                      fileName: "[project]/app/(pages)/issue/page.tsx",
                      lineNumber: 48,
                      columnNumber: 9,
                    },
                    this,
                  ),
                ],
              },
              void 0,
              true,
              {
                fileName: "[project]/app/(pages)/issue/page.tsx",
                lineNumber: 44,
                columnNumber: 7,
              },
              this,
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
              "jsxDEV"
            ])(
              "div",
              {
                className: "grid grid-cols-[1fr_266px] gap-[30px]",
                children: [
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                    "jsxDEV"
                  ])(
                    "section",
                    {
                      className: "flex flex-col gap-[13px]",
                      children: [
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                          "jsxDEV"
                        ])(
                          "div",
                          {
                            className: "flex items-baseline gap-2.5",
                            children: [
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                "jsxDEV"
                              ])(
                                "h2",
                                {
                                  className:
                                    "text-2xl font-extrabold tracking-[-0.04em]",
                                  children: "진행 중인 이슈",
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    "[project]/app/(pages)/issue/page.tsx",
                                  lineNumber: 96,
                                  columnNumber: 13,
                                },
                                this,
                              ),
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                "jsxDEV"
                              ])(
                                "span",
                                {
                                  className:
                                    "text-ink-subtle text-[12.5px] font-bold tabular-nums",
                                  children: [
                                    list.length,
                                    "건 · 참여 완료 ",
                                    votedCount,
                                    "건",
                                  ],
                                },
                                void 0,
                                true,
                                {
                                  fileName:
                                    "[project]/app/(pages)/issue/page.tsx",
                                  lineNumber: 99,
                                  columnNumber: 13,
                                },
                                this,
                              ),
                            ],
                          },
                          void 0,
                          true,
                          {
                            fileName: "[project]/app/(pages)/issue/page.tsx",
                            lineNumber: 95,
                            columnNumber: 11,
                          },
                          this,
                        ),
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                          "jsxDEV"
                        ])(
                          "div",
                          {
                            className: "grid grid-cols-2 gap-[13px]",
                            children: list.map((issue) =>
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                "jsxDEV"
                              ])(
                                __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$issue$2d$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                  "IssueCard"
                                ],
                                {
                                  issue: issue,
                                  onVote: handleVote,
                                },
                                issue.id,
                                false,
                                {
                                  fileName:
                                    "[project]/app/(pages)/issue/page.tsx",
                                  lineNumber: 106,
                                  columnNumber: 15,
                                },
                                this,
                              ),
                            ),
                          },
                          void 0,
                          false,
                          {
                            fileName: "[project]/app/(pages)/issue/page.tsx",
                            lineNumber: 104,
                            columnNumber: 11,
                          },
                          this,
                        ),
                        list.length === 0 &&
                          /*#__PURE__*/ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                            "jsxDEV"
                          ])(
                            "div",
                            {
                              className:
                                "border-line-strong text-ink-subtle rounded-xl border border-dashed px-5 py-10 text-center text-sm font-bold",
                              children: "이 카테고리에 진행 중인 이슈가 없어요",
                            },
                            void 0,
                            false,
                            {
                              fileName: "[project]/app/(pages)/issue/page.tsx",
                              lineNumber: 111,
                              columnNumber: 13,
                            },
                            this,
                          ),
                      ],
                    },
                    void 0,
                    true,
                    {
                      fileName: "[project]/app/(pages)/issue/page.tsx",
                      lineNumber: 94,
                      columnNumber: 9,
                    },
                    this,
                  ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                    "jsxDEV"
                  ])(
                    "aside",
                    {
                      className: "flex flex-col gap-[13px]",
                      children: [
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                          "jsxDEV"
                        ])(
                          "div",
                          {
                            className:
                              "flex flex-col gap-3 rounded-2xl p-[17px]",
                            style: {
                              background:
                                "linear-gradient(105deg, var(--accent), var(--accent-deep))",
                            },
                            children: [
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                "jsxDEV"
                              ])(
                                "span",
                                {
                                  className:
                                    "text-[11.5px] font-bold text-[color:color-mix(in_oklab,var(--accent-ink)_62%,transparent)]",
                                  children: ["내 신용도 · ", ME.tier],
                                },
                                void 0,
                                true,
                                {
                                  fileName:
                                    "[project]/app/(pages)/issue/page.tsx",
                                  lineNumber: 125,
                                  columnNumber: 13,
                                },
                                this,
                              ),
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                "jsxDEV"
                              ])(
                                "span",
                                {
                                  className:
                                    "text-accent-ink text-4xl leading-none font-extrabold tracking-[-0.045em] tabular-nums",
                                  children: score.toLocaleString(),
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    "[project]/app/(pages)/issue/page.tsx",
                                  lineNumber: 128,
                                  columnNumber: 13,
                                },
                                this,
                              ),
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                "jsxDEV"
                              ])(
                                "div",
                                {
                                  className:
                                    "h-[5px] overflow-hidden rounded-full bg-[color:color-mix(in_oklab,var(--accent-ink)_22%,transparent)]",
                                  children: /*#__PURE__*/ (0,
                                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                    "jsxDEV"
                                  ])(
                                    "div",
                                    {
                                      className: "bg-accent-ink h-full",
                                      style: {
                                        width: `${progress}%`,
                                      },
                                    },
                                    void 0,
                                    false,
                                    {
                                      fileName:
                                        "[project]/app/(pages)/issue/page.tsx",
                                      lineNumber: 132,
                                      columnNumber: 15,
                                    },
                                    this,
                                  ),
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    "[project]/app/(pages)/issue/page.tsx",
                                  lineNumber: 131,
                                  columnNumber: 13,
                                },
                                this,
                              ),
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                "jsxDEV"
                              ])(
                                "div",
                                {
                                  className: "flex items-center",
                                  children: [
                                    /*#__PURE__*/ (0,
                                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                      "jsxDEV"
                                    ])(
                                      "span",
                                      {
                                        className:
                                          "text-[11.5px] font-bold text-[color:color-mix(in_oklab,var(--accent-ink)_65%,transparent)] tabular-nums",
                                        children: [
                                          "플래티넘까지 ",
                                          applyDelta(ME.nextTierAt - score, 0),
                                          "점",
                                        ],
                                      },
                                      void 0,
                                      true,
                                      {
                                        fileName:
                                          "[project]/app/(pages)/issue/page.tsx",
                                        lineNumber: 138,
                                        columnNumber: 15,
                                      },
                                      this,
                                    ),
                                    /*#__PURE__*/ (0,
                                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                      "jsxDEV"
                                    ])(
                                      "div",
                                      {
                                        className: "flex-auto",
                                      },
                                      void 0,
                                      false,
                                      {
                                        fileName:
                                          "[project]/app/(pages)/issue/page.tsx",
                                        lineNumber: 141,
                                        columnNumber: 15,
                                      },
                                      this,
                                    ),
                                    /*#__PURE__*/ (0,
                                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                      "jsxDEV"
                                    ])(
                                      "span",
                                      {
                                        className:
                                          "text-accent-ink text-[11.5px] font-extrabold tabular-nums",
                                        children: [
                                          ME.weeklyHit,
                                          " / ",
                                          ME.weeklyTotal,
                                          " 적중",
                                        ],
                                      },
                                      void 0,
                                      true,
                                      {
                                        fileName:
                                          "[project]/app/(pages)/issue/page.tsx",
                                        lineNumber: 142,
                                        columnNumber: 15,
                                      },
                                      this,
                                    ),
                                  ],
                                },
                                void 0,
                                true,
                                {
                                  fileName:
                                    "[project]/app/(pages)/issue/page.tsx",
                                  lineNumber: 137,
                                  columnNumber: 13,
                                },
                                this,
                              ),
                            ],
                          },
                          void 0,
                          true,
                          {
                            fileName: "[project]/app/(pages)/issue/page.tsx",
                            lineNumber: 118,
                            columnNumber: 11,
                          },
                          this,
                        ),
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                          "jsxDEV"
                        ])(
                          "div",
                          {
                            className:
                              "border-line flex flex-col gap-[13px] rounded-2xl border bg-card p-[17px]",
                            children: [
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                "jsxDEV"
                              ])(
                                "span",
                                {
                                  className:
                                    "text-ink-subtle text-[11.5px] font-bold",
                                  children: "이번 주 소수 적중 랭킹",
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    "[project]/app/(pages)/issue/page.tsx",
                                  lineNumber: 149,
                                  columnNumber: 13,
                                },
                                this,
                              ),
                              RANKING.map((r) =>
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                  "jsxDEV"
                                ])(
                                  "div",
                                  {
                                    className: "flex items-center gap-2.5",
                                    children: [
                                      /*#__PURE__*/ (0,
                                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                        "jsxDEV"
                                      ])(
                                        "span",
                                        {
                                          className: `w-3.5 text-xs font-extrabold tabular-nums ${r.rank === 1 ? "text-accent" : "text-ink-subtle"}`,
                                          children: r.rank,
                                        },
                                        void 0,
                                        false,
                                        {
                                          fileName:
                                            "[project]/app/(pages)/issue/page.tsx",
                                          lineNumber: 154,
                                          columnNumber: 17,
                                        },
                                        this,
                                      ),
                                      /*#__PURE__*/ (0,
                                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                        "jsxDEV"
                                      ])(
                                        "span",
                                        {
                                          className:
                                            "text-ink-muted flex-1 text-[13px] font-bold",
                                          children: r.name,
                                        },
                                        void 0,
                                        false,
                                        {
                                          fileName:
                                            "[project]/app/(pages)/issue/page.tsx",
                                          lineNumber: 161,
                                          columnNumber: 17,
                                        },
                                        this,
                                      ),
                                      /*#__PURE__*/ (0,
                                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                        "jsxDEV"
                                      ])(
                                        "span",
                                        {
                                          className:
                                            "text-ink-muted text-[12.5px] font-extrabold tabular-nums",
                                          children: ["+", r.gained],
                                        },
                                        void 0,
                                        true,
                                        {
                                          fileName:
                                            "[project]/app/(pages)/issue/page.tsx",
                                          lineNumber: 164,
                                          columnNumber: 17,
                                        },
                                        this,
                                      ),
                                    ],
                                  },
                                  r.rank,
                                  true,
                                  {
                                    fileName:
                                      "[project]/app/(pages)/issue/page.tsx",
                                    lineNumber: 153,
                                    columnNumber: 15,
                                  },
                                  this,
                                ),
                              ),
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                "jsxDEV"
                              ])(
                                "div",
                                {
                                  className: "bg-line h-px",
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    "[project]/app/(pages)/issue/page.tsx",
                                  lineNumber: 169,
                                  columnNumber: 13,
                                },
                                this,
                              ),
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                "jsxDEV"
                              ])(
                                "div",
                                {
                                  className: "flex items-center gap-2.5",
                                  children: [
                                    /*#__PURE__*/ (0,
                                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                      "jsxDEV"
                                    ])(
                                      "span",
                                      {
                                        className:
                                          "text-ink-subtle w-3.5 text-xs font-extrabold tabular-nums",
                                        children: MY_RANK.rank,
                                      },
                                      void 0,
                                      false,
                                      {
                                        fileName:
                                          "[project]/app/(pages)/issue/page.tsx",
                                        lineNumber: 171,
                                        columnNumber: 15,
                                      },
                                      this,
                                    ),
                                    /*#__PURE__*/ (0,
                                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                      "jsxDEV"
                                    ])(
                                      "span",
                                      {
                                        className:
                                          "flex-1 text-[13px] font-bold",
                                        children: MY_RANK.name,
                                      },
                                      void 0,
                                      false,
                                      {
                                        fileName:
                                          "[project]/app/(pages)/issue/page.tsx",
                                        lineNumber: 174,
                                        columnNumber: 15,
                                      },
                                      this,
                                    ),
                                    /*#__PURE__*/ (0,
                                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                      "jsxDEV"
                                    ])(
                                      "span",
                                      {
                                        className:
                                          "text-[12.5px] font-extrabold tabular-nums",
                                        children: ["+", MY_RANK.gained],
                                      },
                                      void 0,
                                      true,
                                      {
                                        fileName:
                                          "[project]/app/(pages)/issue/page.tsx",
                                        lineNumber: 177,
                                        columnNumber: 15,
                                      },
                                      this,
                                    ),
                                  ],
                                },
                                void 0,
                                true,
                                {
                                  fileName:
                                    "[project]/app/(pages)/issue/page.tsx",
                                  lineNumber: 170,
                                  columnNumber: 13,
                                },
                                this,
                              ),
                            ],
                          },
                          void 0,
                          true,
                          {
                            fileName: "[project]/app/(pages)/issue/page.tsx",
                            lineNumber: 148,
                            columnNumber: 11,
                          },
                          this,
                        ),
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                          "jsxDEV"
                        ])(
                          "div",
                          {
                            className:
                              "border-line-strong flex flex-col gap-[7px] rounded-2xl border border-dashed p-4",
                            children: [
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                "jsxDEV"
                              ])(
                                "span",
                                {
                                  className: "text-[12.5px] font-bold",
                                  children: "돈은 걸지 않습니다",
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    "[project]/app/(pages)/issue/page.tsx",
                                  lineNumber: 184,
                                  columnNumber: 13,
                                },
                                this,
                              ),
                              /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                "jsxDEV"
                              ])(
                                "span",
                                {
                                  className:
                                    "text-ink-subtle text-[11.5px] leading-[1.6] font-medium text-pretty",
                                  children:
                                    "현금·코인·아이템 없이 신용도 점수와 티어만 오갑니다. 점수는 0점 아래로 내려가지 않습니다.",
                                },
                                void 0,
                                false,
                                {
                                  fileName:
                                    "[project]/app/(pages)/issue/page.tsx",
                                  lineNumber: 185,
                                  columnNumber: 13,
                                },
                                this,
                              ),
                            ],
                          },
                          void 0,
                          true,
                          {
                            fileName: "[project]/app/(pages)/issue/page.tsx",
                            lineNumber: 183,
                            columnNumber: 11,
                          },
                          this,
                        ),
                      ],
                    },
                    void 0,
                    true,
                    {
                      fileName: "[project]/app/(pages)/issue/page.tsx",
                      lineNumber: 117,
                      columnNumber: 9,
                    },
                    this,
                  ),
                ],
              },
              void 0,
              true,
              {
                fileName: "[project]/app/(pages)/issue/page.tsx",
                lineNumber: 93,
                columnNumber: 7,
              },
              this,
            ),
          ],
        },
        void 0,
        true,
        {
          fileName: "[project]/app/(pages)/issue/page.tsx",
          lineNumber: 43,
          columnNumber: 5,
        },
        this,
      )
    }
  },
  "[project]/components/icon.tsx [app-ssr] (ecmascript)",
  (__turbopack_context__) => {
    "use strict"

    __turbopack_context__.s(["Icon", () => Icon])
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)",
      )
    function Icon({ name, filled = true, size = 16, className, style }) {
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
        "jsxDEV"
      ])(
        "span",
        {
          "aria-hidden": true,
          className: className,
          style: {
            fontFamily: "'Material Symbols Rounded'",
            fontSize: size,
            lineHeight: 1,
            fontVariationSettings: `'FILL' ${filled ? 1 : 0}`,
            ...style,
          },
          children: name,
        },
        void 0,
        false,
        {
          fileName: "[project]/components/icon.tsx",
          lineNumber: 20,
          columnNumber: 5,
        },
        this,
      )
    }
  },
  "[project]/components/issue-card.tsx [app-ssr] (ecmascript)",
  (__turbopack_context__) => {
    "use strict"

    __turbopack_context__.s(["IssueCard", () => IssueCard])
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)",
      )
    var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$icon$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/components/icon.tsx [app-ssr] (ecmascript)",
      )
    var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mock$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i("[project]/lib/mock.ts [app-ssr] (ecmascript)")
    ;("use client")
    function IssueCard({ issue, onVote, onOpen }) {
      const cat =
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mock$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
          "CATEGORY_MAP"
        ][issue.category]
      const settled = issue.status === "settled"
      const pending = issue.status === "pending"
      const result = issue.settlement?.result
      const surface = settled
        ? "bg-card-hot border-[color:color-mix(in_oklab,var(--accent)_32%,transparent)]"
        : pending
          ? "bg-sunken border-[rgb(255_255_255/0.05)]"
          : "bg-card border-line"
      const minorityPct =
        issue.ratio && issue.myChoice ? issue.ratio[issue.myChoice] : undefined
      const isMinority = minorityPct !== undefined && minorityPct < 50
      const deltaColor =
        result === "correct"
          ? "text-accent"
          : result === "wrong"
            ? "text-wrong"
            : "text-void"
      const deltaLabel =
        issue.settlement === undefined
          ? ""
          : issue.settlement.result === "void"
            ? "±0"
            : issue.settlement.delta > 0
              ? `+${issue.settlement.delta}`
              : `${issue.settlement.delta}`
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
        "jsxDEV"
      ])(
        "article",
        {
          className: `flex overflow-hidden rounded-xl border ${surface}`,
          onClick: settled || pending ? () => onOpen?.(issue.id) : undefined,
          children: [
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
              "jsxDEV"
            ])(
              "div",
              {
                className: "w-1 flex-none",
                style: {
                  background: pending
                    ? `color-mix(in oklab, ${cat.color} 45%, transparent)`
                    : cat.color,
                },
              },
              void 0,
              false,
              {
                fileName: "[project]/components/issue-card.tsx",
                lineNumber: 63,
                columnNumber: 7,
              },
              this,
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
              "jsxDEV"
            ])(
              "div",
              {
                className: "flex flex-1 flex-col gap-3 px-[18px] py-[17px]",
                children: [
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                    "jsxDEV"
                  ])(
                    "div",
                    {
                      className: "flex items-center gap-2",
                      children: [
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                          "jsxDEV"
                        ])(
                          __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$icon$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                            "Icon"
                          ],
                          {
                            name: cat.icon,
                            size: 16,
                            style: {
                              color: pending
                                ? `color-mix(in oklab, ${cat.color} 60%, transparent)`
                                : cat.color,
                            },
                          },
                          void 0,
                          false,
                          {
                            fileName: "[project]/components/issue-card.tsx",
                            lineNumber: 70,
                            columnNumber: 11,
                          },
                          this,
                        ),
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                          "jsxDEV"
                        ])(
                          "span",
                          {
                            className: "text-xs font-bold",
                            style: {
                              color: pending
                                ? `color-mix(in oklab, ${cat.color} 60%, transparent)`
                                : cat.color,
                            },
                            children: cat.label,
                          },
                          void 0,
                          false,
                          {
                            fileName: "[project]/components/issue-card.tsx",
                            lineNumber: 71,
                            columnNumber: 11,
                          },
                          this,
                        ),
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                          "jsxDEV"
                        ])(
                          "span",
                          {
                            className:
                              "text-xs font-semibold text-ink-faint tabular-nums",
                            children: [
                              issue.participants.toLocaleString(),
                              "명 참여",
                            ],
                          },
                          void 0,
                          true,
                          {
                            fileName: "[project]/components/issue-card.tsx",
                            lineNumber: 77,
                            columnNumber: 11,
                          },
                          this,
                        ),
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                          "jsxDEV"
                        ])(
                          "div",
                          {
                            className: "flex-auto",
                          },
                          void 0,
                          false,
                          {
                            fileName: "[project]/components/issue-card.tsx",
                            lineNumber: 81,
                            columnNumber: 11,
                          },
                          this,
                        ),
                        settled
                          ? /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                              "jsxDEV"
                            ])(
                              "span",
                              {
                                className:
                                  result === "correct"
                                    ? "rounded-md bg-accent px-2 py-1 text-[11.5px] font-extrabold leading-none text-accent-ink"
                                    : result === "wrong"
                                      ? "rounded-md bg-wrong-chip px-2 py-1 text-[11.5px] font-extrabold leading-none text-[#D6DEEC]"
                                      : "rounded-md border border-[color:color-mix(in_oklab,var(--void)_45%,transparent)] px-2 py-[3px] text-[11.5px] font-extrabold leading-none text-void",
                                children:
                                  result === "correct"
                                    ? `소수 ${minorityPct}% 적중`
                                    : result === "wrong"
                                      ? "오답"
                                      : "무효",
                              },
                              void 0,
                              false,
                              {
                                fileName: "[project]/components/issue-card.tsx",
                                lineNumber: 84,
                                columnNumber: 13,
                              },
                              this,
                            )
                          : pending
                            ? /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                "jsxDEV"
                              ])(
                                "span",
                                {
                                  className:
                                    "inline-flex items-center gap-1.5 text-[12.5px] font-bold text-ink-subtle",
                                  children: [
                                    /*#__PURE__*/ (0,
                                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                      "jsxDEV"
                                    ])(
                                      __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$icon$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                        "Icon"
                                      ],
                                      {
                                        name: "hourglass_top",
                                        filled: false,
                                        size: 15,
                                      },
                                      void 0,
                                      false,
                                      {
                                        fileName:
                                          "[project]/components/issue-card.tsx",
                                        lineNumber: 101,
                                        columnNumber: 15,
                                      },
                                      this,
                                    ),
                                    "결과 대기",
                                  ],
                                },
                                void 0,
                                true,
                                {
                                  fileName:
                                    "[project]/components/issue-card.tsx",
                                  lineNumber: 100,
                                  columnNumber: 13,
                                },
                                this,
                              )
                            : /*#__PURE__*/ (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                "jsxDEV"
                              ])(
                                "span",
                                {
                                  className: `text-[12.5px] font-extrabold tabular-nums ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mock$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isUrgent"])(issue.closesAt) ? "text-accent" : "text-ink-subtle"}`,
                                  children: [
                                    (0,
                                    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mock$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                      "formatRemaining"
                                    ])(issue.closesAt),
                                    " 남음",
                                  ],
                                },
                                void 0,
                                true,
                                {
                                  fileName:
                                    "[project]/components/issue-card.tsx",
                                  lineNumber: 105,
                                  columnNumber: 13,
                                },
                                this,
                              ),
                      ],
                    },
                    void 0,
                    true,
                    {
                      fileName: "[project]/components/issue-card.tsx",
                      lineNumber: 69,
                      columnNumber: 9,
                    },
                    this,
                  ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                    "jsxDEV"
                  ])(
                    "h3",
                    {
                      className: `text-xl font-bold leading-[1.35] tracking-[-0.03em] text-pretty ${pending ? "text-ink-muted" : "text-ink"}`,
                      children: issue.question,
                    },
                    void 0,
                    false,
                    {
                      fileName: "[project]/components/issue-card.tsx",
                      lineNumber: 115,
                      columnNumber: 9,
                    },
                    this,
                  ),
                  issue.status === "open" &&
                    /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                      "jsxDEV"
                    ])(
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                        "Fragment"
                      ],
                      {
                        children: [
                          /*#__PURE__*/ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                            "jsxDEV"
                          ])(
                            "div",
                            {
                              className: "flex gap-2",
                              children: [
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                  "jsxDEV"
                                ])(
                                  "button",
                                  {
                                    type: "button",
                                    onClick: () => onVote?.(issue.id, "yes"),
                                    className:
                                      "flex-1 rounded-lg border border-[rgb(255_255_255/0.09)] bg-control py-[13px] text-sm font-bold tracking-[-0.02em] text-ink transition-colors hover:border-accent hover:text-accent",
                                    children: issue.labels.yes,
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      "[project]/components/issue-card.tsx",
                                    lineNumber: 126,
                                    columnNumber: 15,
                                  },
                                  this,
                                ),
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                  "jsxDEV"
                                ])(
                                  "button",
                                  {
                                    type: "button",
                                    onClick: () => onVote?.(issue.id, "no"),
                                    className:
                                      "flex-1 rounded-lg border border-[rgb(255_255_255/0.09)] bg-control py-[13px] text-sm font-bold tracking-[-0.02em] text-ink transition-colors hover:border-accent hover:text-accent",
                                    children: issue.labels.no,
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      "[project]/components/issue-card.tsx",
                                    lineNumber: 133,
                                    columnNumber: 15,
                                  },
                                  this,
                                ),
                              ],
                            },
                            void 0,
                            true,
                            {
                              fileName: "[project]/components/issue-card.tsx",
                              lineNumber: 125,
                              columnNumber: 13,
                            },
                            this,
                          ),
                          /*#__PURE__*/ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                            "jsxDEV"
                          ])(
                            "p",
                            {
                              className:
                                "text-[11.5px] font-semibold text-ink-faint",
                              children: [
                                issue.source,
                                " · 비율은 투표 후 공개",
                              ],
                            },
                            void 0,
                            true,
                            {
                              fileName: "[project]/components/issue-card.tsx",
                              lineNumber: 141,
                              columnNumber: 13,
                            },
                            this,
                          ),
                        ],
                      },
                      void 0,
                      true,
                      {
                        fileName: "[project]/components/issue-card.tsx",
                        lineNumber: 124,
                        columnNumber: 11,
                      },
                      this,
                    ),
                  issue.status === "voted" &&
                    issue.myChoice &&
                    issue.ratio &&
                    /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                      "jsxDEV"
                    ])(
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                        "Fragment"
                      ],
                      {
                        children: [
                          /*#__PURE__*/ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                            "jsxDEV"
                          ])(
                            "div",
                            {
                              className:
                                "flex items-center gap-2.5 rounded-lg bg-sunken px-[13px] py-3",
                              children: [
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                  "jsxDEV"
                                ])(
                                  __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$icon$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                    "Icon"
                                  ],
                                  {
                                    name: "check_circle",
                                    size: 17,
                                    className: "text-accent",
                                    style: {
                                      color: "var(--accent)",
                                    },
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      "[project]/components/issue-card.tsx",
                                    lineNumber: 150,
                                    columnNumber: 15,
                                  },
                                  this,
                                ),
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                  "jsxDEV"
                                ])(
                                  "span",
                                  {
                                    className:
                                      "text-[13.5px] font-bold tracking-[-0.02em]",
                                    children: [
                                      "내 선택 · ",
                                      issue.labels[issue.myChoice],
                                    ],
                                  },
                                  void 0,
                                  true,
                                  {
                                    fileName:
                                      "[project]/components/issue-card.tsx",
                                    lineNumber: 151,
                                    columnNumber: 15,
                                  },
                                  this,
                                ),
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                  "jsxDEV"
                                ])(
                                  "div",
                                  {
                                    className: "flex-auto",
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      "[project]/components/issue-card.tsx",
                                    lineNumber: 154,
                                    columnNumber: 15,
                                  },
                                  this,
                                ),
                                isMinority &&
                                  /*#__PURE__*/ (0,
                                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                    "jsxDEV"
                                  ])(
                                    "span",
                                    {
                                      className:
                                        "rounded-md bg-[color:color-mix(in_oklab,var(--accent)_14%,transparent)] px-[7px] py-[5px] text-[11.5px] font-extrabold leading-none text-accent tabular-nums",
                                      children: [minorityPct, "%만 이쪽"],
                                    },
                                    void 0,
                                    true,
                                    {
                                      fileName:
                                        "[project]/components/issue-card.tsx",
                                      lineNumber: 156,
                                      columnNumber: 17,
                                    },
                                    this,
                                  ),
                              ],
                            },
                            void 0,
                            true,
                            {
                              fileName: "[project]/components/issue-card.tsx",
                              lineNumber: 149,
                              columnNumber: 13,
                            },
                            this,
                          ),
                          /*#__PURE__*/ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                            "jsxDEV"
                          ])(
                            "div",
                            {
                              className: "flex h-1.5 gap-1",
                              children: [
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                  "jsxDEV"
                                ])(
                                  "div",
                                  {
                                    className: "rounded-full bg-accent",
                                    style: {
                                      width: `${minorityPct}%`,
                                    },
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      "[project]/components/issue-card.tsx",
                                    lineNumber: 162,
                                    columnNumber: 15,
                                  },
                                  this,
                                ),
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                  "jsxDEV"
                                ])(
                                  "div",
                                  {
                                    className: "flex-1 rounded-full bg-track",
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      "[project]/components/issue-card.tsx",
                                    lineNumber: 166,
                                    columnNumber: 15,
                                  },
                                  this,
                                ),
                              ],
                            },
                            void 0,
                            true,
                            {
                              fileName: "[project]/components/issue-card.tsx",
                              lineNumber: 161,
                              columnNumber: 13,
                            },
                            this,
                          ),
                        ],
                      },
                      void 0,
                      true,
                      {
                        fileName: "[project]/components/issue-card.tsx",
                        lineNumber: 148,
                        columnNumber: 11,
                      },
                      this,
                    ),
                  pending &&
                    issue.myChoice &&
                    /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                      "jsxDEV"
                    ])(
                      "p",
                      {
                        className:
                          "text-[11.5px] font-semibold text-ink-faint tabular-nums",
                        children: [
                          new Date(issue.settlesAt).toLocaleTimeString(
                            "ko-KR",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          ),
                          " ",
                          "판정 예정 · 내 선택 ",
                          issue.labels[issue.myChoice],
                        ],
                      },
                      void 0,
                      true,
                      {
                        fileName: "[project]/components/issue-card.tsx",
                        lineNumber: 172,
                        columnNumber: 11,
                      },
                      this,
                    ),
                  settled &&
                    issue.settlement &&
                    /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                      "jsxDEV"
                    ])(
                      "div",
                      {
                        className: "flex items-end gap-4",
                        children: [
                          /*#__PURE__*/ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                            "jsxDEV"
                          ])(
                            "div",
                            {
                              className: "flex flex-1 flex-col gap-1",
                              children: [
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                  "jsxDEV"
                                ])(
                                  "span",
                                  {
                                    className: `text-[13px] font-bold tracking-[-0.02em] ${deltaColor}`,
                                    children:
                                      result === "correct"
                                        ? "맞혔어요"
                                        : result === "wrong"
                                          ? "아쉽게 틀렸어요"
                                          : "무효 처리",
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      "[project]/components/issue-card.tsx",
                                    lineNumber: 184,
                                    columnNumber: 15,
                                  },
                                  this,
                                ),
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                                  "jsxDEV"
                                ])(
                                  "span",
                                  {
                                    className:
                                      "text-[11.5px] font-semibold leading-[1.55] text-ink-faint text-pretty",
                                    children: issue.settlement.note,
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      "[project]/components/issue-card.tsx",
                                    lineNumber: 193,
                                    columnNumber: 15,
                                  },
                                  this,
                                ),
                              ],
                            },
                            void 0,
                            true,
                            {
                              fileName: "[project]/components/issue-card.tsx",
                              lineNumber: 183,
                              columnNumber: 13,
                            },
                            this,
                          ),
                          /*#__PURE__*/ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__[
                            "jsxDEV"
                          ])(
                            "span",
                            {
                              className: `text-[32px] font-extrabold leading-[0.9] tracking-[-0.045em] tabular-nums ${deltaColor}`,
                              children: deltaLabel,
                            },
                            void 0,
                            false,
                            {
                              fileName: "[project]/components/issue-card.tsx",
                              lineNumber: 197,
                              columnNumber: 13,
                            },
                            this,
                          ),
                        ],
                      },
                      void 0,
                      true,
                      {
                        fileName: "[project]/components/issue-card.tsx",
                        lineNumber: 182,
                        columnNumber: 11,
                      },
                      this,
                    ),
                ],
              },
              void 0,
              true,
              {
                fileName: "[project]/components/issue-card.tsx",
                lineNumber: 68,
                columnNumber: 7,
              },
              this,
            ),
          ],
        },
        void 0,
        true,
        {
          fileName: "[project]/components/issue-card.tsx",
          lineNumber: 59,
          columnNumber: 5,
        },
        this,
      )
    }
  },
  "[project]/lib/mock.ts [app-ssr] (ecmascript)",
  (__turbopack_context__) => {
    "use strict"

    __turbopack_context__.s([
      "CATEGORIES",
      () => CATEGORIES,
      "CATEGORY_MAP",
      () => CATEGORY_MAP,
      "ISSUES",
      () => ISSUES,
      "ME",
      () => ME,
      "MY_RANK",
      () => MY_RANK,
      "RANKING",
      () => RANKING,
      "applyDelta",
      () => applyDelta,
      "formatRemaining",
      () => formatRemaining,
      "isUrgent",
      () => isUrgent,
    ])
    const CATEGORIES = [
      {
        label: "전체",
        value: "all",
        icon: "bolt",
        color: "var(--ink)",
        count: 28,
      },
      {
        label: "정치",
        value: "politics",
        icon: "how_to_vote",
        color: "var(--cat-politics)",
        count: 3,
      },
      {
        label: "스포츠",
        value: "sport",
        icon: "sports_soccer",
        color: "var(--cat-sports)",
        count: 8,
      },
      {
        label: "E스포츠",
        value: "eSport",
        icon: "stadia_controller",
        color: "var(--cat-esports)",
        count: 5,
      },
      {
        label: "연예",
        value: "entertainment",
        icon: "mic",
        color: "var(--cat-ent)",
        count: 6,
      },
      {
        label: "경제",
        value: "economy",
        icon: "monitoring",
        color: "var(--cat-econ)",
        count: 2,
      },
      {
        label: "날씨",
        value: "weather",
        icon: "rainy",
        color: "var(--cat-weather)",
        count: 4,
      },
    ]
    const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]))
    const ME = {
      name: "박지혁",
      score: 1000,
      tier: "골드 3",
      nextTierAt: 1500,
      weeklyHit: 7,
      weeklyTotal: 9,
    }
    const ISSUES = [
      {
        id: "iss_weather_seoul_rain",
        category: "weather",
        question: "내일 서울에 비 올까?",
        source: "기상청 공식 발표 기준",
        labels: {
          yes: "올 것 같다",
          no: "안 올 것 같다",
        },
        closesAt: "2026-08-29T22:00:00+09:00",
        settlesAt: "2026-08-30T09:00:00+09:00",
        participants: 1284,
        status: "open",
      },
      {
        id: "iss_sport_a_team",
        category: "sport",
        question: "오늘 경기, A팀이 이길까?",
        source: "공식 기록 기준",
        labels: {
          yes: "이길 것 같다",
          no: "질 것 같다",
        },
        closesAt: "2026-08-29T20:30:00+09:00",
        settlesAt: "2026-08-29T23:00:00+09:00",
        participants: 3102,
        status: "voted",
        myChoice: "yes",
        ratio: {
          yes: 17,
          no: 83,
        },
      },
      {
        id: "iss_esport_t1",
        category: "eSport",
        question: "이번 주 경기, T1이 이길까?",
        source: "리그 공식 결과 기준",
        labels: {
          yes: "이길 것 같다",
          no: "질 것 같다",
        },
        closesAt: "2026-08-29T18:00:00+09:00",
        settlesAt: "2026-08-29T22:00:00+09:00",
        participants: 8940,
        status: "pending",
        myChoice: "yes",
        ratio: {
          yes: 41,
          no: 59,
        },
      },
      {
        id: "iss_ent_music_no1",
        category: "entertainment",
        question: "이번 주 음악방송 1위, A가 차지할까?",
        source: "방송사 공식 발표 기준",
        labels: {
          yes: "차지할 것 같다",
          no: "못 할 것 같다",
        },
        closesAt: "2026-08-28T17:00:00+09:00",
        settlesAt: "2026-08-28T19:00:00+09:00",
        participants: 4410,
        status: "settled",
        myChoice: "yes",
        ratio: {
          yes: 22,
          no: 78,
        },
        settlement: {
          result: "correct",
          answer: "yes",
          delta: 33,
          weight: 3.6,
          note: "22%만 이쪽을 골랐어요",
        },
      },
      {
        id: "iss_econ_base_rate",
        category: "economy",
        question: "한국은행 이번 달 기준금리 인상할까?",
        source: "금융통화위원회 의결 기준",
        labels: {
          yes: "인상할 것 같다",
          no: "동결할 것 같다",
        },
        closesAt: "2026-08-31T09:00:00+09:00",
        settlesAt: "2026-08-31T11:00:00+09:00",
        participants: 2077,
        status: "settled",
        myChoice: "yes",
        ratio: {
          yes: 64,
          no: 36,
        },
        settlement: {
          result: "wrong",
          answer: "no",
          delta: -21,
          note: "64%가 이쪽이었어요. 흐름을 거스른 판이었습니다.",
        },
      },
      {
        id: "iss_politics_candidate_a",
        category: "politics",
        question: "이번 선거, A 후보 당선될까?",
        source: "중앙선거관리위원회 공식 개표 기준",
        labels: {
          yes: "당선될 것 같다",
          no: "안 될 것 같다",
        },
        closesAt: "2026-08-28T20:00:00+09:00",
        settlesAt: "2026-08-28T23:00:00+09:00",
        participants: 5320,
        status: "settled",
        myChoice: "no",
        settlement: {
          result: "void",
          delta: 0,
          note: "선거가 연기되어 결과를 판정할 수 없었습니다.",
        },
      },
    ]
    const RANKING = [
      {
        rank: 1,
        name: "촉이좋은사람",
        gained: 412,
      },
      {
        rank: 2,
        name: "역발상러",
        gained: 388,
      },
      {
        rank: 3,
        name: "비올확률99",
        gained: 341,
      },
    ]
    const MY_RANK = {
      rank: 18,
      name: "나",
      gained: 126,
    }
    function applyDelta(score, delta) {
      return Math.max(0, score + delta)
    }
    function formatRemaining(iso, now = new Date("2026-08-29T18:47:20+09:00")) {
      const ms = new Date(iso).getTime() - now.getTime()
      if (ms <= 0) return "마감"
      const total = Math.floor(ms / 1000)
      const d = Math.floor(total / 86400)
      const h = Math.floor((total % 86400) / 3600)
      const m = Math.floor((total % 3600) / 60)
      const s = total % 60
      const pad = (n) => String(n).padStart(2, "0")
      return d > 0
        ? `${d}일 ${pad(h)}:${pad(m)}`
        : `${pad(h)}:${pad(m)}:${pad(s)}`
    }
    function isUrgent(iso, now = new Date("2026-08-29T18:47:20+09:00")) {
      const ms = new Date(iso).getTime() - now.getTime()
      return ms > 0 && ms < 1000 * 60 * 60 * 4
    }
  },
]

//# sourceMappingURL=_0lzmxu9._.js.map
