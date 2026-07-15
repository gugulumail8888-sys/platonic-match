-- お見合いお断り理由(運営統計用、申請者には非開示)を追加(タスク#71対応)
ALTER TABLE matchings
  ADD COLUMN IF NOT EXISTS reject_reason TEXT;
