import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useClinicalRecords, type ClinicalRecord } from "@/contexts/ClinicalRecordContext";
import ClinicalRecordList from "./clinical/ClinicalRecordList";
import ClinicalRecordForm from "./clinical/ClinicalRecordForm";
import ClinicalRecordDetail from "./clinical/ClinicalRecordDetail";

type View = "list" | "form" | "detail";

const RegistroClinicoTab = () => {
  const { records, addRecord, updateRecord, deleteRecord } = useClinicalRecords();

  const [view, setView] = useState<View>("list");
  const [selectedRecord, setSelectedRecord] = useState<ClinicalRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<ClinicalRecord | undefined>(undefined);

  const getNextRecordNumber = () => {
    const nums = records.map(r => {
      const match = r.prontuarioNumber.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });
    return Math.max(0, ...nums) + 1;
  };

  const handleOpenRecord = (record: ClinicalRecord) => {
    setSelectedRecord(record);
    setView("detail");
  };

  const handleEditRecord = (record: ClinicalRecord) => {
    setEditingRecord(record);
    setView("form");
  };

  const handleDeleteRecord = (id: string) => {
    deleteRecord(id);
    toast({ title: "Registro removido" });
  };

  const handleNewRecord = () => {
    setEditingRecord(undefined);
    setView("form");
  };

  const handleSave = (data: Omit<ClinicalRecord, "id">, editingId?: string) => {
    if (editingId) {
      updateRecord(editingId, data);
      toast({ title: "Registro atualizado!" });
    } else {
      addRecord(data);
      toast({ title: "Registro gestacional criado!" });
    }
    setView("list");
  };

  const handleRecordUpdate = (updatedRecord: ClinicalRecord) => {
    setSelectedRecord(updatedRecord);
  };

  if (view === "form") {
    return (
      <ClinicalRecordForm
        initialData={editingRecord}
        nextNumber={getNextRecordNumber()}
        onSave={handleSave}
        onCancel={() => setView("list")}
      />
    );
  }

  if (view === "detail" && selectedRecord) {
    return (
      <ClinicalRecordDetail
        record={selectedRecord}
        onBack={() => setView("list")}
        onEdit={() => handleEditRecord(selectedRecord)}
        onRecordUpdate={handleRecordUpdate}
      />
    );
  }

  return (
    <ClinicalRecordList
      records={records}
      onOpenRecord={handleOpenRecord}
      onEditRecord={handleEditRecord}
      onDeleteRecord={handleDeleteRecord}
      onNewRecord={handleNewRecord}
    />
  );
};

export default RegistroClinicoTab;
