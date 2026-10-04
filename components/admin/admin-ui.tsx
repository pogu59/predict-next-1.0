"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import {
  BadgeCheck,
  CalendarClock,
  Circle,
  CircleDot,
  CircleMinus,
  CirclePlus,
  EyeOff,
  Image as ImageIcon,
  Pencil,
  Plus,
  Shield,
  Trash2,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { createContext, useContext, useRef, useState } from "react"

import type { AdminIssueListItem } from "@/lib/api"
import {
  DAY,
  HOUR,
  formatDateTime,
  fromDateTimeLocal,
  optionPercents,
  toDateTimeLocal,
} from "@/lib/issues"
import {
  useAdminIssue,
  useConfirmAdminIssue,
  useCreateAdminIssue,
  useDeleteAdminIssue,
  useExtendAdminIssueDeadline,
  useUpdateAdminIssue,
} from "@/lib/queries/admin"
import { useUploadImage } from "@/lib/queries/post"
import { cn } from "@/lib/utils"
import { ImageBox } from "@/components/ui/image-box"
import { useToast } from "@/components/ui/toast"

type GenericConfirm = {
  title: string
  description: string
  okLabel: string
  danger?: boolean
  onOk: () => Promise<unknown> | void
}

type AdminUI = {
  openCreate: () => void
  openEdit: (issueId: number) => void
  askConfirmResult: (issue: AdminIssueListItem) => void
  askExtend: (issue: AdminIssueListItem) => void
  askDelete: (issue: AdminIssueListItem) => void
  askGeneric: (confirm: GenericConfirm) => void
}

const AdminUIContext = createContext<AdminUI | null>(null)

export function useAdminUI() {
  const value = useContext(AdminUIContext)
  if (!value) throw new Error("useAdminUI는 관리자 레이아웃 안에서만 쓸 수 있어요")
  return value
}

type Modal =
  | { kind: "confirm"; issue: AdminIssueListItem }
  | { kind: "extend"; issue: AdminIssueListItem }
  | { kind: "delete"; issue: AdminIssueListItem }
  | { kind: "generic"; confirm: GenericConfirm }

type Drawer = { mode: "create" } | { mode: "edit"; issueId: number }

/**
 * 관리자 화면 공용 오버레이(이슈 생성/수정 드로어, 결과 확정·마감 연장·삭제·일반 확인 모달).
 * 대시보드와 이슈 관리, 상단 "새 이슈 만들기"가 모두 같은 드로어/모달을 열어서 레이아웃에 둔다.
 */
export function AdminUIProvider({ children }: { children: React.ReactNode }) {
  const [drawer, setDrawer] = useState<Drawer | null>(null)
  const [modal, setModal] = useState<Modal | null>(null)

  const ui: AdminUI = {
    openCreate: () => setDrawer({ mode: "create" }),
    openEdit: (issueId) => setDrawer({ mode: "edit", issueId }),
    askConfirmResult: (issue) => setModal({ kind: "confirm", issue }),
    askExtend: (issue) => setModal({ kind: "extend", issue }),
    askDelete: (issue) => setModal({ kind: "delete", issue }),
    askGeneric: (confirm) => setModal({ kind: "generic", confirm }),
  }

  const close = () => setModal(null)

  return (
    <AdminUIContext.Provider value={ui}>
      {children}
      {drawer && (
        <IssueDrawer
          key={drawer.mode === "edit" ? drawer.issueId : "create"}
          drawer={drawer}
          onClose={() => setDrawer(null)}
        />
      )}
      {modal?.kind === "confirm" && <ConfirmResultModal issue={modal.issue} onClose={close} />}
      {modal?.kind === "extend" && <ExtendModal issue={modal.issue} onClose={close} />}
      {modal?.kind === "delete" && <DeleteModal issue={modal.issue} onClose={close} />}
      {modal?.kind === "generic" && <GenericModal confirm={modal.confirm} onClose={close} />}
    </AdminUIContext.Provider>
  )
}

// ---- 모달 공통 ----

type AdminModalProps = {
  Icon: LucideIcon
  iconClass: string
  title: string
  description: string
  children?: React.ReactNode
  okLabel: string
  okEnabled?: boolean
  okTone?: "brand" | "danger"
  loading?: boolean
  onOk: () => void
  onClose: () => void
}

function AdminModal({
  Icon,
  iconClass,
  title,
  description,
  children,
  okLabel,
  okEnabled = true,
  okTone = "brand",
  loading = false,
  onOk,
  onClose,
}: AdminModalProps) {
  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 animate-fade-in bg-scrim" />
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-6">
          <DialogPrimitive.Popup className="pointer-events-auto flex w-[460px] max-w-full animate-pop flex-col gap-4 rounded-[26px] bg-surface p-[26px] outline-none">
            <span className={cn("grid size-12 place-items-center rounded-[15px]", iconClass)}>
              <Icon className="size-[22px]" />
            </span>
            <div className="flex flex-col gap-1.5">
              <DialogPrimitive.Title className="text-xl font-extrabold tracking-[-0.03em]">{title}</DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm leading-[1.6] text-sub">
                {description}
              </DialogPrimitive.Description>
            </div>
            {children}
            <div className="mt-1.5 flex gap-2">
              <DialogPrimitive.Close
                disabled={loading}
                className="h-[50px] flex-1 rounded-[14px] bg-track text-[15px] font-bold text-ink"
              >
                취소
              </DialogPrimitive.Close>
              <button
                type="button"
                onClick={() => okEnabled && !loading && onOk()}
                className={cn(
                  "h-[50px] flex-1 rounded-[14px] text-[15px] font-bold",
                  !okEnabled
                    ? "bg-disabled-bg text-muted"
                    : okTone === "danger"
                      ? "bg-danger text-white"
                      : "bg-brand text-white",
                )}
              >
                {okLabel}
              </button>
            </div>
          </DialogPrimitive.Popup>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function QuickChips({ items }: { items: { label: string; onClick: () => void }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((q) => (
        <button
          key={q.label}
          type="button"
          onClick={q.onClick}
          className="rounded-[9px] bg-track px-[11px] py-[7px] text-xs font-bold text-sub hover:bg-[#EAEAE7]"
        >
          {q.label}
        </button>
      ))}
    </div>
  )
}

function ConfirmResultModal({ issue, onClose }: { issue: AdminIssueListItem; onClose: () => void }) {
  const showToast = useToast()
  const confirm = useConfirmAdminIssue()
  const [sel, setSel] = useState<number | null>(null)
  const pct = optionPercents(issue.options)

  return (
    <AdminModal
      Icon={BadgeCheck}
      iconClass="bg-brand-soft text-brand"
      title="결과 확정"
      description={`"${issue.title}"의 정답을 선택해 주세요. 확정 후에는 신용도가 정산되며 되돌릴 수 없어요.`}
      okLabel="정답 확정"
      okEnabled={sel !== null}
      loading={confirm.isPending}
      onClose={onClose}
      onOk={() => {
        if (sel === null) return
        const text = issue.options.find((o) => o.id === sel)?.text
        confirm.mutate(
          { issueId: issue.id, correctOptionId: sel },
          {
            onSuccess: () => {
              onClose()
              showToast(`정답을 '${text}'(으)로 확정했어요`)
            },
            onError: (e) => showToast(e.message),
          },
        )
      }}
    >
      <div className="flex flex-col gap-2">
        {issue.options.map((o) => {
          const on = sel === o.id
          const Icon = on ? CircleDot : Circle
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setSel(o.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-[14px] px-4 py-3.5 text-left",
                on ? "bg-[#F6F5FF] shadow-selected" : "bg-surface shadow-[inset_0_0_0_1.5px_#EDEDEB]",
              )}
            >
              <Icon className={cn("size-5", on ? "text-brand" : "text-disabled-ink")} />
              <span className="flex-1 text-[15px] font-semibold">{o.text}</span>
              <span className="text-[13px] font-semibold text-muted tabular-nums">{pct[o.id]}%</span>
            </button>
          )
        })}
      </div>
    </AdminModal>
  )
}

function ExtendModal({ issue, onClose }: { issue: AdminIssueListItem; onClose: () => void }) {
  const showToast = useToast()
  const extend = useExtendAdminIssueDeadline()
  const current = Date.parse(issue.voteDeadlineAt)
  const base = () => Math.max(current, Date.now())
  const [value, setValue] = useState(() => toDateTimeLocal(base() + DAY))
  const next = fromDateTimeLocal(value)
  const ok = !Number.isNaN(next) && next > current

  return (
    <AdminModal
      Icon={CalendarClock}
      iconClass="bg-track text-ink"
      title="마감 연장"
      description={issue.title}
      okLabel="연장하기"
      okEnabled={ok}
      loading={extend.isPending}
      onClose={onClose}
      onOk={() =>
        extend.mutate(
          { issueId: issue.id, newDeadline: value },
          {
            onSuccess: () => {
              onClose()
              showToast(`마감을 ${formatDateTime(next)}로 연장했어요`)
            },
            onError: (e) => showToast(e.message),
          },
        )
      }
    >
      <div className="flex flex-col gap-2.5">
        <span className="text-[13px] text-sub">
          현재 마감 · <b className="text-ink">{formatDateTime(current)}</b>
        </span>
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={cn(
            "h-[50px] rounded-[14px] border-[1.5px] px-4 text-[15px] outline-none",
            ok ? "border-line-2" : "border-danger",
          )}
        />
        <QuickChips
          items={[
            { label: "+1시간", ms: HOUR },
            { label: "+1일", ms: DAY },
            { label: "+3일", ms: 3 * DAY },
          ].map((q) => ({ label: q.label, onClick: () => setValue(toDateTimeLocal(base() + q.ms)) }))}
        />
        {!ok && <span className="text-xs text-danger">현재 마감보다 이후로 설정해 주세요</span>}
      </div>
    </AdminModal>
  )
}

function DeleteModal({ issue, onClose }: { issue: AdminIssueListItem; onClose: () => void }) {
  const showToast = useToast()
  const remove = useDeleteAdminIssue()
  return (
    <AdminModal
      Icon={Trash2}
      iconClass="bg-danger-soft text-danger-ink"
      title="이슈를 삭제할까요?"
      description={`"${issue.title}" 이슈와 댓글이 모두 삭제돼요. 걸린 신용도는 참여자에게 전액 반환돼요.`}
      okLabel="삭제"
      okTone="danger"
      loading={remove.isPending}
      onClose={onClose}
      onOk={() =>
        remove.mutate(issue.id, {
          onSuccess: () => {
            onClose()
            showToast("이슈를 삭제했어요")
          },
          onError: (e) => showToast(e.message),
        })
      }
    />
  )
}

function GenericModal({ confirm, onClose }: { confirm: GenericConfirm; onClose: () => void }) {
  const showToast = useToast()
  const [loading, setLoading] = useState(false)
  const danger = confirm.danger ?? true
  return (
    <AdminModal
      Icon={danger ? TriangleAlert : Shield}
      iconClass={danger ? "bg-danger-soft text-danger-ink" : "bg-brand-soft text-brand"}
      title={confirm.title}
      description={confirm.description}
      okLabel={confirm.okLabel}
      okTone={danger ? "danger" : "brand"}
      loading={loading}
      onClose={onClose}
      onOk={async () => {
        setLoading(true)
        try {
          await confirm.onOk()
          onClose()
        } catch (e) {
          showToast((e as { message?: string }).message ?? "요청에 실패했습니다")
        } finally {
          setLoading(false)
        }
      }}
    />
  )
}

// ---- 이슈 생성/수정 드로어 ----

const OPTION_PLACEHOLDERS = ["예: 동결", "예: 인하", "예: 인상", "선택지 4", "선택지 5", "선택지 6"]

type DrawerForm = {
  coverImageUrl: string
  title: string
  description: string
  deadline: string
  options: string[]
  voteStartAt?: string
}

function emptyForm(): DrawerForm {
  return {
    coverImageUrl: "",
    title: "",
    description: "",
    deadline: toDateTimeLocal(Date.now() + 3 * DAY),
    options: ["", "", ""],
  }
}

function validate(form: DrawerForm) {
  const titleOk = form.title.trim().length > 0
  const deadline = fromDateTimeLocal(form.deadline)
  const deadlineOk = !Number.isNaN(deadline) && deadline > Date.now()
  const filled = form.options.map((o) => o.trim()).filter(Boolean)
  const duplicated = new Set(filled).size !== filled.length
  const optionsOk = filled.length >= 2 && filled.length === form.options.length && !duplicated
  const optionMessage = duplicated
    ? "같은 선택지가 있어요"
    : filled.length < form.options.length
      ? "빈 선택지를 채우거나 삭제해 주세요"
      : "선택지를 2개 이상 입력해 주세요"
  return { titleOk, deadlineOk, optionsOk, optionMessage, all: titleOk && deadlineOk && optionsOk }
}

function IssueDrawer({ drawer, onClose }: { drawer: Drawer; onClose: () => void }) {
  const issueId = drawer.mode === "edit" ? drawer.issueId : undefined
  const { data: detail } = useAdminIssue(issueId)

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-40 animate-fade-in bg-[rgb(17_17_19/0.35)]" />
        <DialogPrimitive.Popup className="fixed inset-y-0 right-0 z-40 flex w-[540px] max-w-full animate-slide-in flex-col bg-surface shadow-[-20px_0_60px_rgba(0,0,0,.12)] outline-none">
          {drawer.mode === "create" ? (
            <DrawerBody mode="create" initial={emptyForm} onClose={onClose} />
          ) : detail ? (
            <DrawerBody
              mode="edit"
              issueId={detail.id}
              initial={{
                coverImageUrl: detail.coverImageUrl ?? "",
                title: detail.title,
                description: detail.description ?? "",
                deadline: toDateTimeLocal(detail.voteDeadlineAt),
                options: detail.options.map((o) => o.text),
                voteStartAt: detail.voteStartAt,
              }}
              onClose={onClose}
            />
          ) : (
            <div className="grid flex-1 place-items-center text-sm text-faint">
              <DialogPrimitive.Title>불러오는 중...</DialogPrimitive.Title>
            </div>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function DrawerBody({
  mode,
  issueId,
  initial,
  onClose,
}: {
  mode: "create" | "edit"
  issueId?: number
  initial: DrawerForm | (() => DrawerForm)
  onClose: () => void
}) {
  const router = useRouter()
  const showToast = useToast()
  const create = useCreateAdminIssue()
  const update = useUpdateAdminIssue()
  const upload = useUploadImage()
  const fileInput = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState(initial)
  const [tried, setTried] = useState(false)
  const v = validate(form)
  const set = (patch: Partial<DrawerForm>) => setForm((f) => ({ ...f, ...patch }))
  const saving = create.isPending || update.isPending

  async function uploadCover(file: File | undefined) {
    if (!file) return
    try {
      const { url } = await upload.mutateAsync(file)
      set({ coverImageUrl: url })
    } catch (e) {
      showToast((e as { message?: string }).message ?? "이미지를 올리지 못했어요")
    }
  }

  function save() {
    if (!v.all) {
      setTried(true)
      return
    }
    if (saving) return
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      // 생성 시 시작 시각은 다음 분 — 서버가 과거 시작 시각을 거절하지 않도록 올림한다.
      voteStartAt: form.voteStartAt ?? toDateTimeLocal(Math.ceil((Date.now() + 1) / 60_000) * 60_000),
      voteDeadlineAt: form.deadline,
      options: form.options.map((o) => o.trim()),
      coverImageUrl: form.coverImageUrl || undefined,
    }
    if (mode === "create") {
      create.mutate(payload, {
        onSuccess: () => {
          onClose()
          router.push("/admin/issues")
          showToast("이슈를 게시했어요")
        },
        onError: (e) => showToast(e.message),
      })
    } else if (issueId !== undefined) {
      update.mutate(
        { issueId, payload },
        {
          onSuccess: () => {
            onClose()
            showToast("수정 내용을 저장했어요")
          },
          onError: (e) => showToast(e.message),
        },
      )
    }
  }

  const HeadingIcon = mode === "create" ? CirclePlus : Pencil

  return (
    <>
      <div className="flex h-[68px] flex-none items-center justify-between border-b border-line px-7">
        <DialogPrimitive.Title className="flex items-center gap-2 text-xl font-extrabold tracking-[-0.03em]">
          <HeadingIcon className="size-5 text-brand" />
          {mode === "create" ? "새 이슈 만들기" : "이슈 수정"}
        </DialogPrimitive.Title>
        <DialogPrimitive.Close aria-label="닫기">
          <X className="size-[22px] text-sub" />
        </DialogPrimitive.Close>
      </div>

      <div className="flex flex-1 flex-col gap-[22px] overflow-y-auto px-7 py-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold">
            커버 이미지 <span className="text-xs font-medium text-faint">선택 · 앱 카드와 상세 상단에 노출</span>
          </span>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => uploadCover(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              uploadCover(e.dataTransfer.files?.[0])
            }}
            className="relative h-[180px] overflow-hidden rounded-2xl bg-track"
          >
            {form.coverImageUrl ? (
              <ImageBox src={form.coverImageUrl} className="absolute inset-0" />
            ) : (
              <span className="flex flex-col items-center gap-2 text-[13px] font-semibold text-muted">
                <ImageIcon className="size-7 text-disabled-ink" />
                이미지를 끌어다 놓거나 클릭해서 업로드
              </span>
            )}
          </button>
        </div>

        <label className="flex flex-col gap-2">
          <span className="flex justify-between text-sm font-bold">
            제목 <span className="text-xs font-medium text-faint tabular-nums">{form.title.length}/60</span>
          </span>
          <input
            value={form.title}
            onChange={(e) => set({ title: e.target.value })}
            maxLength={60}
            placeholder="예: 10월 기준금리, 한국은행의 결정은?"
            className={cn(
              "h-[50px] rounded-[14px] border-[1.5px] px-4 text-[15px] outline-none",
              tried && !v.titleOk ? "border-danger" : "border-line-2",
            )}
          />
          {tried && !v.titleOk && <span className="text-xs text-danger">제목을 입력해 주세요</span>}
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold">
            설명 <span className="text-xs font-medium text-faint">판정 기준을 함께 적어주세요</span>
          </span>
          <textarea
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            rows={4}
            placeholder="예: 한국은행 공식 발표 기준으로 판정합니다."
            className="resize-y rounded-[14px] border-[1.5px] border-line-2 px-4 py-3.5 text-[15px] leading-[1.6] outline-none"
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold">마감일</span>
          <input
            type="datetime-local"
            value={form.deadline}
            onChange={(e) => set({ deadline: e.target.value })}
            className={cn(
              "h-[50px] rounded-[14px] border-[1.5px] px-4 text-[15px] text-ink outline-none",
              tried && !v.deadlineOk ? "border-danger" : "border-line-2",
            )}
          />
          <QuickChips
            items={[
              { label: "+1일", ms: DAY },
              { label: "+3일", ms: 3 * DAY },
              { label: "+1주", ms: 7 * DAY },
              { label: "+2주", ms: 14 * DAY },
            ].map((q) => ({ label: q.label, onClick: () => set({ deadline: toDateTimeLocal(Date.now() + q.ms) }) }))}
          />
          {tried && !v.deadlineOk && <span className="text-xs text-danger">현재 시각 이후로 설정해 주세요</span>}
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="flex justify-between text-sm font-bold">
            선택지 <span className="text-xs font-medium text-faint">최소 2개 · 최대 6개</span>
          </span>
          {form.options.map((value, i) => {
            const removable = form.options.length > 2
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="grid size-7 flex-none place-items-center rounded-lg bg-brand-soft text-[13px] font-extrabold text-brand">
                  {i + 1}
                </span>
                <input
                  value={value}
                  maxLength={30}
                  onChange={(e) => {
                    const options = [...form.options]
                    options[i] = e.target.value
                    set({ options })
                  }}
                  placeholder={OPTION_PLACEHOLDERS[i]}
                  className={cn(
                    "h-[46px] min-w-0 flex-1 rounded-xl border-[1.5px] px-3.5 text-[15px] outline-none",
                    tried && !value.trim() ? "border-danger" : "border-line-2",
                  )}
                />
                <button
                  type="button"
                  disabled={!removable}
                  onClick={() => set({ options: form.options.filter((_, j) => j !== i) })}
                  className={cn("p-1.5", removable ? "cursor-pointer text-placeholder" : "cursor-default text-disabled-bg")}
                  aria-label="선택지 삭제"
                >
                  <CircleMinus className="size-5" />
                </button>
              </div>
            )
          })}
          {form.options.length < 6 && (
            <button
              type="button"
              onClick={() => set({ options: [...form.options, ""] })}
              className="flex h-[46px] items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-[#D6D6D3] text-sm font-bold text-sub hover:border-brand hover:text-brand"
            >
              <Plus className="size-[17px]" />
              선택지 추가
            </button>
          )}
          {tried && !v.optionsOk && <span className="text-xs text-danger">{v.optionMessage}</span>}
        </div>

        <div className="flex gap-2.5 rounded-2xl bg-bg px-4 py-3.5 text-[13px] leading-[1.6] text-sub">
          <EyeOff className="size-[18px] flex-none text-muted" />
          <span>사용자에게는 참여 인원 없이 선택지별 비율(%)만 공개돼요.</span>
        </div>
      </div>

      <div className="flex flex-none gap-2 border-t border-line px-7 pt-4 pb-[22px]">
        <DialogPrimitive.Close className="h-[52px] flex-1 rounded-[14px] bg-track text-[15px] font-bold text-ink">
          취소
        </DialogPrimitive.Close>
        <button
          type="button"
          onClick={save}
          className="h-[52px] flex-[2] rounded-[14px] bg-brand text-[15px] font-bold text-white"
        >
          {mode === "create" ? "이슈 게시하기" : "저장하기"}
        </button>
      </div>
    </>
  )
}
